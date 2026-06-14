import React, { useState } from 'react';
import { createBox } from '../utilities/api';

export default function BoxSelector({ boxes, setBoxes, selectedBoxId, setSelectedBoxId }) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    createBox({ name, location })
      .then(newBox => {
        setBoxes([...boxes, newBox]);
        setSelectedBoxId(newBox.id);
        setName('');
        setLocation('');
      })
      .catch(err => alert("Error saving box registration"));
  };

  return (
    <div style={{ marginBottom: '25px' }}>
      <section style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '6px' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>+ Open New Inventory Container</h4>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <input type="text" placeholder="Box Label Name" value={name} onChange={e => setName(e.target.value)} required />
          <input type="text" placeholder="Physical Store Location" value={location} onChange={e => setLocation(e.target.value)} required />
          <button type="submit" style={{ background: '#3182ce', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>Add Box to Vault</button>
        </form>
      </section>

      <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Target Processing Container:</label>
      <select value={selectedBoxId} onChange={e => setSelectedBoxId(e.target.value)} style={{ width: '100%', padding: '10px', fontSize: '16px' }}>
        {boxes.map(b => (
          <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
        ))}
      </select>
    </div>
  );
}