// src/utilities/api.js
const API_BASE_URL = 'http://127.0.0.1:8001/api/v1';

export async function fetchBoxes() {
  const res = await fetch(`${API_BASE_URL}/boxes`);
  if (!res.ok) throw new Error("Failed to pull longbox indices.");
  return res.json();
}

export async function createBox(boxData) {
  const res = await fetch(`${API_BASE_URL}/boxes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(boxData),
  });
  if (!res.ok) throw new Error("Failed to execute new container commit.");
  return res.json();
}

export async function fetchValuation(boxId) {
  const res = await fetch(`${API_BASE_URL}/boxes/${boxId}/valuation`);
  if (!res.ok) throw new Error("Failed to process balance metrics.");
  return res.json();
}

export async function postBarcodeScan(payload) {
  console.log
  const response = await fetch(`${API_BASE_URL}/scan/process-barcode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) throw new Error('Network payload resolution error');
  return response.json();
}

export async function searchComics(query) {
  const res = await fetch(`${API_BASE_URL}/comics/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Search execution pipeline failure.");
  return res.json();
}

export async function fetchSeriesOverview(title, publisher) {
  const res = await fetch(`${API_BASE_URL}/series/overview?title=${encodeURIComponent(title)}&publisher=${encodeURIComponent(publisher)}`);
  if (!res.ok) throw new Error("Failed to load series historical run.");
  return res.json();
}