from pydantic import BaseModel
from typing import List

class BatchScanPayload(BaseModel):
    box_id: int
    barcodes: List[str]



class ScanRequest(BaseModel):
    barcode: str
    box_id: int