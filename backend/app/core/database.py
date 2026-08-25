import os
import json
import uuid
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import motor.motor_asyncio
from pymongo import ASCENDING, DESCENDING
from app.core.config import settings

class InMemoryCursor:
    def __init__(self, data: List[Dict[str, Any]]):
        self._data = list(data)
        self._skip_val = 0
        self._limit_val = None

    def sort(self, key_or_list, direction=None):
        if isinstance(key_or_list, list):
            for k, d in reversed(key_or_list):
                reverse = (d == -1 or d == DESCENDING)
                self._data.sort(key=lambda x: (x.get(k) is None, x.get(k)), reverse=reverse)
        else:
            k = key_or_list
            reverse = (direction == -1 or direction == DESCENDING)
            self._data.sort(key=lambda x: (x.get(k) is None, x.get(k)), reverse=reverse)
        return self

    def skip(self, count: int):
        self._skip_val = count
        return self

    def limit(self, count: int):
        self._limit_val = count
        return self

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        result = self._data[self._skip_val:]
        if self._limit_val is not None:
            result = result[:self._limit_val]
        if length is not None:
            result = result[:length]
        return result

    def __aiter__(self):
        self._iter = iter(self._data[self._skip_val:None if self._limit_val is None else self._skip_val + self._limit_val])
        return self

    async def __anext__(self):
        try:
            return next(self._iter)
        except StopIteration:
            raise StopAsyncIteration


class MockCollection:
    def __init__(self, name: str, filepath: Optional[str] = None):
        self.name = name
        self.filepath = filepath
        self._store: Dict[str, Dict[str, Any]] = {}
        self._load()

    def _load(self):
        if self.filepath and os.path.exists(self.filepath):
            try:
                with open(self.filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data:
                        _id = str(item.get("_id") or item.get("id"))
                        self._store[_id] = item
            except Exception:
                pass

    def _save(self):
        if self.filepath:
            os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
            try:
                with open(self.filepath, "w", encoding="utf-8") as f:
                    json.dump(list(self._store.values()), f, default=str, indent=2)
            except Exception:
                pass

    def _match(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        for k, v in query.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._match(doc, sub) for sub in v):
                    return False
                continue
            if k == "$and" and isinstance(v, list):
                if not all(self._match(doc, sub) for sub in v):
                    return False
                continue

            doc_val = doc.get(k)
            if isinstance(v, dict):
                # operators
                for op, op_val in v.items():
                    if op == "$eq" and doc_val != op_val:
                        return False
                    elif op == "$ne" and doc_val == op_val:
                        return False
                    elif op == "$in" and (doc_val not in op_val if doc_val is not None else False):
                        return False
                    elif op == "$nin" and (doc_val in op_val if doc_val is not None else False):
                        return False
                    elif op == "$gt" and not (doc_val is not None and doc_val > op_val):
                        return False
                    elif op == "$gte" and not (doc_val is not None and doc_val >= op_val):
                        return False
                    elif op == "$lt" and not (doc_val is not None and doc_val < op_val):
                        return False
                    elif op == "$lte" and not (doc_val is not None and doc_val <= op_val):
                        return False
                    elif op == "$regex":
                        import re
                        options = v.get("$options", "")
                        flags = re.IGNORECASE if "i" in options else 0
                        if not (isinstance(doc_val, str) and re.search(op_val, doc_val, flags)):
                            return False
            else:
                if doc_val != v:
                    return False
        return True

    async def insert_one(self, document: Dict[str, Any]):
        doc = dict(document)
        if "_id" not in doc:
            doc["_id"] = str(uuid.uuid4())
        doc_id = str(doc["_id"])
        self._store[doc_id] = doc
        self._save()
        
        class InsertResult:
            inserted_id = doc_id
        return InsertResult()

    async def find_one(self, query: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        query = query or {}
        for doc in self._store.values():
            if self._match(doc, query):
                return dict(doc)
        return None

    def find(self, query: Dict[str, Any] = None):
        query = query or {}
        matches = [dict(doc) for doc in self._store.values() if self._match(doc, query)]
        return InMemoryCursor(matches)

    async def count_documents(self, query: Dict[str, Any] = None) -> int:
        query = query or {}
        count = sum(1 for doc in self._store.values() if self._match(doc, query))
        return count

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        target_id = None
        for doc_id, doc in self._store.items():
            if self._match(doc, query):
                target_id = doc_id
                break
        
        if not target_id:
            class UpdateResult:
                matched_count = 0
                modified_count = 0
            return UpdateResult()

        doc = self._store[target_id]
        if "$set" in update:
            for k, v in update["$set"].items():
                doc[k] = v
        if "$push" in update:
            for k, v in update["$push"].items():
                if k not in doc or not isinstance(doc[k], list):
                    doc[k] = []
                doc[k].append(v)
        if "$inc" in update:
            for k, v in update["$inc"].items():
                doc[k] = doc.get(k, 0) + v

        self._store[target_id] = doc
        self._save()

        class UpdateResult:
            matched_count = 1
            modified_count = 1
        return UpdateResult()

    async def delete_one(self, query: Dict[str, Any]):
        target_id = None
        for doc_id, doc in self._store.items():
            if self._match(doc, query):
                target_id = doc_id
                break
        if target_id and target_id in self._store:
            del self._store[target_id]
            self._save()
            class DeleteResult:
                deleted_count = 1
            return DeleteResult()
        class DeleteResult:
            deleted_count = 0
        return DeleteResult()


class Database:
    def __init__(self):
        self.client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
        self.db = None
        self.is_connected: bool = False
        self.using_mock: bool = True  # Default to fallback mock until explicit connect
        self._mock_collections: Dict[str, MockCollection] = {}

    async def connect(self):
        try:
            # Attempt to connect to real MongoDB with short timeout
            self.client = motor.motor_asyncio.AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=1500
            )
            # Check connection
            await self.client.admin.command('ping')
            self.db = self.client[settings.DATABASE_NAME]
            self.is_connected = True
            self.using_mock = False
            print(f"[*] Successfully connected to MongoDB at: {settings.MONGODB_URI} (DB: {settings.DATABASE_NAME})")
        except Exception as e:
            if settings.USE_MOCK_DB_FALLBACK:
                print(f"[!] MongoDB not reachable ({e}). Initializing In-Memory/JSON database fallback.")
                self.using_mock = True
                self.is_connected = True
            else:
                raise e

    def get_collection(self, name: str):
        if self.using_mock or self.db is None:
            if name not in self._mock_collections:
                data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
                self._mock_collections[name] = MockCollection(name, os.path.join(data_dir, f"{name}.json"))
            return self._mock_collections[name]
        return self.db[name]

    async def close(self):
        if self.client and not self.using_mock:
            self.client.close()
            print("[*] MongoDB connection closed.")

database = Database()

def get_users_collection():
    return database.get_collection("users")

def get_prs_collection():
    return database.get_collection("prs")

def get_activities_collection():
    return database.get_collection("activities")
