import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas'; // Assuming react-signature-canvas is or will be installed

const SignaturePad = ({ onSave, onCancel }) => {
  const sigCanvas = useRef({});
  const [error, setError] = useState('');

  const clear = () => {
    sigCanvas.current.clear();
    setError('');
  };

  const save = () => {
    if (sigCanvas.current.isEmpty()) {
      setError('Please provide a signature first.');
      return;
    }
    // Export signature to Base64
    const dataURL = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    onSave(dataURL);
  };

  return (
    <div className="flex flex-col items-center bg-white p-4 rounded shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-2">Customer Signature</h3>
      <div className="border border-dashed border-gray-400 bg-gray-50 rounded mb-4" style={{ width: '100%', maxWidth: '500px' }}>
        <SignatureCanvas 
          ref={sigCanvas} 
          penColor="black"
          canvasProps={{ className: 'sigCanvas w-full h-48', style: { touchAction: 'none' } }} 
        />
      </div>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <div className="flex gap-2">
        <button 
          onClick={clear}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
        >
          Clear
        </button>
        <button 
          onClick={save}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Save Signature
        </button>
        {onCancel && (
          <button 
            onClick={onCancel}
            className="px-4 py-2 bg-transparent text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default SignaturePad;
