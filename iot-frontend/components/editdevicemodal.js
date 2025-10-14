import { useEffect, useState } from "react";

export default function EditDeviceModal({ device, onSubmit, save, onClose }) {
  const [activeStep, setActiveStep] = useState(true);
  const [localCreds, setLocalCreds] = useState({
    name: '',
    label: '',
    clientId: '',
    username: '',
    password: '',
    credentials: null,
  });

  // Sync props → local form state
  useEffect(() => {
    if (!device) return;
    const newCreds = {
      name: device.name || '',
      label: device.label || '',
      clientId: '',
      username: '',
      password: '',
      credentials: device.credentials || null,
    };

    if (
      device?.credentials?.credentialsType === "MQTT_BASIC" &&
      device.credentials.credentialsValue
    ) {
      try {
        const parsed = JSON.parse(device.credentials.credentialsValue);
        newCreds.clientId = parsed.clientId || '';
        newCreds.username = parsed.userName || '';
        newCreds.password = parsed.password || '';
      } catch (err) {
        console.error("Failed to parse credentials", err);
      }
    }

    setLocalCreds(newCreds);
  }, [device]);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Validation logic
  const isStep1Valid = localCreds.name.trim() !== '';
  const isCredentialsValid = 
    !localCreds.clientId || (localCreds.clientId && localCreds.username.trim() !== '' && localCreds.password.trim() !== '');
  const isFormValid = isStep1Valid && isCredentialsValid;

  const handleSubmit = () => {
    if (isFormValid) {
      onSubmit(localCreds);
    }
  };

  if (!device) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-0 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-xl z-10">&times;</button>
        
        <div className="flex">
          {/* Left Section - 40% */}
          <div className="w-2/5 bg-gray-800 p-6 text-white rounded-l-xl">
            <h2 className="text-xl font-semibold mb-4">Edit Device</h2>
            
            {/* Stepper */}
            <div className="space-y-3 mb-4">
              <div className={`flex items-center gap-2 ${activeStep ? "text-blue-400" : "text-gray-400"}`}>
                <span className={`${activeStep ? "bg-blue-500" : "bg-gray-600"} text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold`}>
                  1
                </span>
                <span className="text-sm">Device Details</span>
              </div>
              <div className={`flex items-center gap-2 ${!activeStep ? "text-blue-400" : "text-gray-400"}`}>
                <span className={`${!activeStep ? "bg-blue-500" : "bg-gray-600"} text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold`}>
                  2
                </span>
                <span className="text-sm">Credentials</span>
              </div>
            </div>

            {/* Validation Messages */}
            {!activeStep && localCreds.clientId && (!localCreds.username.trim() || !localCreds.password.trim()) && (
              <div className="text-red-400 text-sm">
                • Username and Password required when Client ID is set
              </div>
            )}
          </div>

          {/* Right Section - 60% */}
          <div className="w-3/5 p-6">
            <div className="space-y-4">
              {activeStep ? (
                <>
                  {['name', 'label'].map(field => (
                    <div key={field}>
                      <label className="block mb-1 text-sm font-medium text-gray-700">{field.toUpperCase()} {field==='name'?'*':''}</label>
                      <input
                        type="text"
                        required={field==='name'}
                        placeholder={`Enter device ${field}`}
                        value={localCreds[field]}
                        onChange={(e) => setLocalCreds((prev) => ({ ...prev, [field]: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-blue-500"
                      />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {['clientId', 'username', 'password'].map(field => (
                    <div key={field}>
                      <label className="block mb-1 text-sm font-medium text-gray-700 capitalize">{field}{!isCredentialsValid && ' *'}</label>
                      <input
                        type={field === 'password' ? 'password' : 'text'}
                        placeholder={`Enter ${field} ${!isCredentialsValid?'':'(optional)'}`}
                        value={localCreds[field] || ''}
                        onChange={(e) => setLocalCreds((prev) => ({ ...prev, [field]: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-blue-500"
                        autoComplete={field === 'password' ? 'new-password' : 'off'}
                      />
                    </div>
                  ))}
                </>
              )}
            </div>
            
            <div className="flex justify-center gap-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(!activeStep)}
                disabled={save || !isStep1Valid}
                className={`px-4 py-2 bg-blue-600 text-white rounded ${save || !isStep1Valid ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {activeStep ? "Next" : "Back"}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={save || !isFormValid}
                className={`px-4 py-2 bg-blue-600 text-white rounded ${save || !isFormValid ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {save ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}