'use client';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { FiPlus, FiTrash2, FiUploadCloud } from 'react-icons/fi';
import { FaRegImage } from "react-icons/fa6";
import { v4 as uuidv4 } from 'uuid';
import DeletePopup from './deletepopup';
import { toast } from 'react-toastify';
import ShowPreviewModal from './ImagePreviewModal';
import { useRouter } from "next/navigation";

export default function CreateDashboardModal({ open, onClose, onSave, existingWidgets = [], existingThresholds = {}, userAuthority }) {
  const router = useRouter();
  const [devices, setDevices] = useState([]);
  const [widgets, setWidgets] = useState([]);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [widgetToDelete, setWidgetToDelete] = useState(null);
  const [isParamDelete, setIsParamDelete] = useState(false);
  const [paramToDelete, setParamToDelete] = useState(null);
  const [currentWidgetIndex, setCurrentWidgetIndex] = useState(0);

  const [availableImages, setAvailableImages] = useState([]);
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImageTitle, setNewImageTitle] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImageTitle, setPreviewImageTitle] = useState('');
  const [previewImageLink, setPreviewImageLink] = useState('');
  const Tb_Url = process.env.NEXT_PUBLIC_TB_URL;

   useEffect(() => {
      if (open) {
        document.body.style.overflow = "hidden";
        function handleKeyDown(e) { if (e.key === "Escape") onClose(); }
        window.addEventListener("keydown", handleKeyDown);
        return () => {
          document.body.style.overflow = "";
          window.removeEventListener("keydown", handleKeyDown);
        };
      } else {
        document.body.style.overflow = "";
      }
    }, [open,onClose]);

  const goToPrevWidget = () => {
    setCurrentWidgetIndex(prev => prev > 0 ? prev - 1 : widgets.length - 1);
  };

  const goToNextWidget = () => {
    setCurrentWidgetIndex(prev => prev < widgets.length - 1 ? prev + 1 : 0);
  };
  const confirmDeleteParam = (widgetIndex, paramIndex) => {
    setIsParamDelete(true);
    setWidgetToDelete(widgetIndex);
    setParamToDelete(paramIndex);
  };

  useEffect(() => {
    if (open) {
      const initialWidgets = existingWidgets.length > 0
        ? existingWidgets.map(w => ({
          ...w,
          parameters: w.parameters ? w.parameters.map(p => ({ ...p })) : []
        }))
        : [{
          id: uuidv4(),
          name: '',
          type: 'bar',
          unit: '',
          parameters: []
        }];

      setWidgets(initialWidgets);
      setCurrentWidgetIndex(0);
    }
  }, [open, existingWidgets]);

  useEffect(() => {
    const tbDevices = JSON.parse(localStorage.getItem('tb_devices') || '[]');
    const token = localStorage.getItem('tb_token');

    if (!token) {
      toast.error('Authentication token missing. Please log in again.');
      return;
    }

    Promise.all(
      tbDevices.map(dev =>
        fetch(`${Tb_Url}/api/plugins/telemetry/DEVICE/${dev.id.id}/keys/timeseries`, {
          headers: { 'X-Authorization': `Bearer ${token}` },
        })
          .then(res => {
            if (!res.ok) {
              console.warn(`Failed to fetch keys for device ${dev.name} (${dev.id.id}): ${res.status} ${res.statusText}`);
              return [];
            }
            return res.json();
          })
          .then(keys => ({
            id: dev.id.id,
            name: dev.name,
            keys: Array.isArray(keys) ? keys : [],
          }))
          .catch(err => {
            console.error(`Error fetching keys for device ${dev.name} (${dev.id.id}):`, err);
            return { id: dev.id.id, name: dev.name, keys: [] };
          })
      )
    )
      .then(setDevices)
      .catch(err => {
        console.error("Overall error fetching devices keys:", err);
        toast.error("Failed to load device telemetry keys.");
      });
  }, []);

  const fetchAvailableImages = async () => {
    const token = localStorage.getItem('tb_token');
    if (!token) return;

    try {
      const res = await fetch('/api/thingsboard/getimage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, pageSize: 100, page: 0 }),
      });
      if (res.status === 401) {
        localStorage.clear();
        toast.error('Session expired. Please log in again.');
        router.push('/');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to fetch available images.');
      }
      const images = await res.json();
      setAvailableImages(images.map(img => ({
        id: img.id.id,
        title: img.title,
        publicLink: img.publicLink
      })));
    } catch (err) {
      console.error('Error fetching images:', err);
      toast.error('Failed to load available images.');
    }
  };

  useEffect(() => {
    if (open && userAuthority === 'TENANT_ADMIN') {
      fetchAvailableImages();
    }
  }, [open, userAuthority]);

  const addWidget = () => {
    setWidgets(w => [...w, {
      id: uuidv4(),
      name: '',
      type: 'bar',
      unit: '',
      parameters: []
    }]);
    setCurrentWidgetIndex(widgets.length);
  };

  const removeWidget = (indexToRemove) => {
    setWidgets(w => {
      const newWidgets = w.filter((_, idx) => idx !== indexToRemove);

      if (newWidgets.length === 0) {
        const defaultWidget = {
          id: uuidv4(),
          name: '',
          type: 'bar',
          unit: '',
          parameters: []
        };
        setCurrentWidgetIndex(0);
        return [defaultWidget];
      }

      if (indexToRemove <= currentWidgetIndex && currentWidgetIndex > 0) {
        setCurrentWidgetIndex(prev => prev - 1);
      } else if (currentWidgetIndex >= newWidgets.length) {
        setCurrentWidgetIndex(newWidgets.length - 1);
      }

      return newWidgets;
    });
  };

  const update = (indexToUpdate, field, val) => setWidgets(w => w.map((x, idx) => idx === indexToUpdate ? { ...x, [field]: val } : x));

  const updateImageParam = (widgetIdx, field, val) => {
    setWidgets(w => w.map((x, idx) => {
      if (idx !== widgetIdx) return x;
      const newParams = [{ ...(x.parameters?.[0] || {}) }];

      if (field === 'imageId') {
        const selectedImage = availableImages.find(img => img.id === val);
        newParams[0].imageId = val;
        newParams[0].publicLink = selectedImage ? selectedImage.publicLink : '';
        newParams[0].title = selectedImage ? selectedImage.title : '';
      } else {
        newParams[0][field] = val;
      }
      return { ...x, parameters: newParams };
    }));
  };

  const handleImageUpload = async (widgetId) => {
    if (!newImageFile || !newImageTitle.trim()) {
      toast.warn('Please select an image file and provide a title.');
      return;
    }
    setUploadingImage(true);
    const token = localStorage.getItem('tb_token');
    if (!token) {
      toast.error('Authentication token missing.');
      setUploadingImage(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', newImageFile);
    formData.append('title', newImageTitle.trim());

    try {
      const res = await fetch('/api/thingsboard/uploadimage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Image upload failed.');
      }

      const uploadedImageInfo = await res.json();
      toast.success('Image uploaded successfully!');

      setWidgets(prevWidgets => prevWidgets.map(w => {
        if (w.id === widgetId) {
          return {
            ...w,
            parameters: [{
              imageId: uploadedImageInfo.id.id,
              publicLink: uploadedImageInfo.publicLink,
              title: uploadedImageInfo.title,
            }],
          };
        }
        return w;
      }));

      setNewImageFile(null);
      setNewImageTitle('');
      if (document.getElementById(`new-image-file-${widgetId}`)) {
        document.getElementById(`new-image-file-${widgetId}`).value = '';
      }
      fetchAvailableImages();

    } catch (err) {
      console.error('Error during image upload:', err);
      toast.error(err.message || 'Error uploading image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const addParam = (widgetIdx) => {
    const widgetType = widgets[widgetIdx].type;
    let newParam = {};

    if (widgetType === 'map') {
      newParam = { deviceId: '', name: '', latKey: '', lonKey: '' };
    } else if (widgetType === 'card') {
      newParam = { deviceId: '', key: '', label: '', min: '', max: '', unit: '' };
    } else if (widgetType === 'table') {
      newParam = { deviceId: '', name: '', keys: [] };
    } else {
      newParam = { deviceId: '', key: '', label: '', min: '', max: '' };
    }

    setWidgets(w => w.map((x, idx) => idx === widgetIdx
      ? { ...x, parameters: [...(x.parameters || []), newParam] }
      : x
    ));
  };

  const updateParam = (wIdx, pIdx, field, val) => {
    if (field === 'min' || field === 'max' || field === 'unit') {
      // Find the specific deviceId and key for the parameter being updated
      const currentParam = widgets[wIdx].parameters[pIdx];
      const { deviceId, key } = currentParam;

      // Update all parameters that match the same deviceId and key
      setWidgets(w => w.map(widget => ({
        ...widget,
        parameters: widget.parameters.map(param =>
          (param.deviceId === deviceId && param.key === key)
            ? { ...param, [field]: val }
            : param
        )
      })));
    } else {
      setWidgets(w => w.map((x, idx) => {
        if (idx !== wIdx) return x;
        const params = x.parameters.map((p, pi) => {
          if (pi === pIdx) {
            const updatedParam = { ...p, [field]: val };

            if (field === 'key' || field === 'deviceId') {
              const thresholdsForDevice = existingThresholds[updatedParam.deviceId];
              const thresholdForKey = thresholdsForDevice?.[updatedParam.key];
              if (thresholdForKey) {
                updatedParam.min = thresholdForKey.min !== null ? thresholdForKey.min : '';
                updatedParam.max = thresholdForKey.max !== null ? thresholdForKey.max : '';
              } else {
                updatedParam.min = '';
                updatedParam.max = '';
              }
            }
            return updatedParam;
          }
          return p;
        });
        return { ...x, parameters: params };
      }));
    }
  };

  const removeParam = (wIdx, pIdx) => setWidgets(w => w.map((x, idx) => {
    if (idx !== wIdx || !x.parameters) return x;
    const params = x.parameters.filter((_, pi) => pi !== pIdx);
    return { ...x, parameters: params };
  })
  );
  const handleTableUnitChange = (widgetIndex, key, unitValue) => {
    setWidgets(widgets => widgets.map((widget, wIdx) => {
      if (wIdx !== widgetIndex) return widget;
      const updatedParams = widget.parameters.map(param => {
        const newKeys = param.keys.map(k => {
          if (k.key === key) {
            return { ...k, unit: unitValue };
          }
          return k;
        });
        return { ...param, keys: newKeys };
      });
      return { ...widget, parameters: updatedParams };
    }));
  };
  const handleDeviceChange = (widgetIndex, paramIndex, deviceId) => {
    const selectedDevice = devices.find(d => d.id === deviceId);
    setWidgets(w => w.map((widget, wIdx) => {
      if (wIdx !== widgetIndex) return widget;
      const updatedParams = widget.parameters.map((param, pIdx) => {
        if (pIdx === paramIndex) {
          const updatedParam = {
            ...param,
            deviceId: deviceId,
            name: selectedDevice ? selectedDevice.name : '',
            keys: []
          };

          const thresholdsForDevice = existingThresholds[deviceId];
          if (thresholdsForDevice?.[updatedParam.key]) {
            const thresholdForKey = thresholdsForDevice[updatedParam.key];
            updatedParam.min = thresholdForKey.min !== null ? thresholdForKey.min : '';
            updatedParam.max = thresholdForKey.max !== null ? thresholdForKey.max : '';
          } else {
            updatedParam.min = '';
            updatedParam.max = '';
          }
          return updatedParam;
        }
        return param;
      });
      return { ...widget, parameters: updatedParams };
    }));
  };
  const handleTableKeyChange = (widgetIndex, key, isChecked) => {
    const updatedWidgets = [...widgets];
    const widgetToUpdate = updatedWidgets[widgetIndex];
    const allDeviceParams = widgetToUpdate.parameters;

    const keyWithUnit = isChecked ? { key, unit: '' } : null;

    const newAllDeviceParams = allDeviceParams.map((p, i) => {
      let newKeys = p.keys ? [...p.keys] : [];
      const keyExists = newKeys.some(k => k.key === key);

      if (isChecked && !keyExists) {
        newKeys.push(keyWithUnit);
      } else if (!isChecked && keyExists) {
        newKeys = newKeys.filter(k => k.key !== key);
      }

      return { ...p, keys: newKeys };
    });

    updatedWidgets[widgetIndex] = { ...widgetToUpdate, parameters: newAllDeviceParams };
    setWidgets(updatedWidgets);
  };

  const handleSave = async () => {
    onSave(widgets);
    const token = localStorage.getItem('tb_token');
    if (!token) {
      localStorage.clear();
      toast.error('Session expired. Please log in again.');
      router.push('/');
      return;
    }
    const deviceThresholds = {};
    widgets.forEach(widget => {
      if (widget.type === 'image' || widget.type === 'map' || widget.type === 'table') {
        return;
      }
      widget.parameters.forEach(param => {
        if (param.min !== '' || param.max !== '') {
          if (!deviceThresholds[param.deviceId]) {
            deviceThresholds[param.deviceId] = {};
          }
          deviceThresholds[param.deviceId][param.key] = {
            min: param.min !== '' ? Number(param.min) : null,
            max: param.max !== '' ? Number(param.max) : null,
          };
        }
      });
    });

    for (const deviceId in deviceThresholds) {
      if (Object.keys(deviceThresholds[deviceId]).length > 0) {
        try {
          const res = await fetch('/api/thingsboard/saveThresholds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token,
              deviceId: deviceId,
              thresholds: deviceThresholds[deviceId],
            }),
          });
          if (res.status === 401) {
            localStorage.clear();
            toast.error('Session expired. Please log in again.');
            router.push('/');
            return;
          }
          if (!res.ok) {
            const errorData = await res.json();
            toast.error(`Failed to save thresholds for device ${deviceId}: ${errorData.error | res.statusText}`);
          }
        } catch (err) {
          console.error(`Error saving thresholds for device ${deviceId}:`, err);
          toast.error(`Error saving thresholds for device ${deviceId}.`);
        }
      }
    }
  };

  const formValid = widgets.length > 0 && widgets.every(w => {
    if (w.name.trim() === '') return false;
    if (w.type === 'image') {
      return w.parameters.length > 0 && w.parameters[0].imageId;
    } else if (w.type === 'map') {
      if (w.parameters.length === 0) return false;
      return w.parameters.every(p => p.deviceId && p.latKey && p.lonKey);
    } else if (w.type === 'card') {
      return w.parameters.length > 0 && w.parameters.every(p => p.deviceId && p.key && p.label.trim() !== '' && p.unit !== '');
    } else if (w.type === 'table') {
      if (w.parameters.length === 0) return false;
      const firstParamKeys = w.parameters[0].keys.map(k => k.key).sort();
      const firstParamUnits = w.parameters[0].keys.map(k => k.unit).filter(Boolean);
      if (firstParamKeys.length === 0 || firstParamUnits.length !== firstParamKeys.length) return false;

      return w.parameters.every(p => {
        const currentParamKeys = p.keys.map(k => k.key).sort();
        const currentParamUnits = p.keys.map(k => k.unit).filter(Boolean);
        return p.deviceId && p.name &&
          currentParamKeys.length === firstParamKeys.length &&
          currentParamUnits.length === currentParamKeys.length &&
          currentParamKeys.every((key, i) => key === firstParamKeys[i]);
      });
    } else if (w.type === 'donut') {
      // Donut chart must have exactly 1 parameter
      return w.parameters.length === 1 &&
        w.parameters.every(p => p.deviceId && p.key && p.label.trim() !== '') && w.unit !== '';
    } else if (w.type === 'pie') {
      // Pie chart must have at least 2 parameters
      return w.parameters.length >= 2 &&
        w.parameters.every(p => p.deviceId && p.key && p.label.trim() !== '') && w.unit !== '';
    } else if (w.type === 'alarms') {
      return true;
    } else {
      return w.parameters.length > 0 &&
        w.parameters.every(p => p.deviceId && p.key && p.label.trim() !== '') && w.unit !== '';
    }
  });

  if (!open) return null;

  const currentWidget = widgets[currentWidgetIndex] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Container */}
      <div className="w-full max-w-7xl h-[90vh] mx-4 bg-[var(--accent-gray)] rounded-xl shadow-xl shadow-white/20 border border-white/20 overflow-hidden flex">

        {/* Left Panel - Widget Navigation (40%) */}
        <div className="w-2/5 bg-[var(--accent-blue)] text-white p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-2">Configure Dashboard Widgets</h2>
          <p className="text-white/80 mb-6">Create and configure widgets for your dashboard. Add different chart types and data visualizations.</p>

          {/* Widget Navigation Controls */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Total Widgets: {widgets.length}</h3>
              <button
                type="button"
                onClick={addWidget}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <FiPlus size={16} />
                Add Widget
              </button>
            </div>

            {widgets.length > 1 && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={goToPrevWidget}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded border border-white/30 text-sm transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-white">
                  {currentWidgetIndex + 1} of {widgets.length}
                </span>
                <button
                  type="button"
                  onClick={goToNextWidget}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded border border-white/30 text-sm transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Current Widget Info */}
          {currentWidget && (
            <div className="bg-white/10 rounded-lg p-4 mb-4 border border-white/20">
              <h4 className="font-semibold text-lg mb-2">
                Current Widget: {currentWidget.name || `Widget ${currentWidgetIndex + 1}`}
              </h4>
              <div className="space-y-1 text-sm text-white/80">
                <p>Type: <span className="capitalize font-medium">{currentWidget.type}</span></p>
                <p>Parameters: <span className="font-medium">{currentWidget.parameters?.length || 0}</span></p>
                <p>Status: <span className={`font-medium ${currentWidget.name && currentWidget.parameters?.length > 0
                  ? 'text-green-300'
                  : 'text-yellow-300'
                  }`}>
                  {currentWidget.name && currentWidget.parameters?.length > 0 ? 'Configured' : 'Incomplete'}
                </span></p>
              </div>
            </div>
          )}

          {/* Widget List Summary */}
          <div className="space-y-2">
            <h4 className="font-semibold mb-3">All Widgets:</h4>
            {widgets.map((widget, index) => (
              <div
                key={widget.id}
                className={clsx(
                  "p-3 rounded cursor-pointer transition-all",
                  index === currentWidgetIndex
                    ? "bg-white/20 border border-white/40"
                    : "bg-white/5 hover:bg-white/10 border border-white/10"
                )}
                onClick={() => setCurrentWidgetIndex(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {widget.name || `Widget ${index + 1}`}
                    </p>
                    <p className="text-xs text-white/70 capitalize">
                      {widget.type} • {widget.parameters?.length || 0} params
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setWidgetToDelete(currentWidgetIndex); setIsDeletePopupOpen(true); }}
                    className="text-red-300 hover:text-red-100 p-1 transition-colors"
                    title="Delete Widget"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Widget Configuration (60%) */}
        <div className="w-3/5 bg-white text-[var(--accent-gray)] flex flex-col">
          {/* Top Bar with Actions */}
          <div className="flex justify-end items-center p-4 border-b border-gray-200">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!formValid}
                className={clsx(
                  "px-6 py-2 rounded-lg text-sm font-medium transition-all",
                  formValid
                    ? "bg-[var(--accent-sky)] hover:bg-blue-700 text-[var(--accent-gray)] shadow-md"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                )}
              >
                Save & Continue
              </button>
            </div>
          </div>

          {/* Configuration Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {currentWidget && (
              <>
                {/* Widget Basic Info */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-[var(--accent-gray)] mb-4">Widget Settings</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--accent-gray)] mb-2">Widget Name</label>
                      <input
                        type="text"
                        className={clsx(
                          "w-full bg-white border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] text-[var(--accent-gray)]",
                          (!currentWidget?.name || !currentWidget.name.trim()) && "border-red-400"
                        )}
                        placeholder="Enter widget name"
                        value={currentWidget?.name || ''}
                        onChange={e => update(currentWidgetIndex, "name", e.target.value)}
                      />
                    </div>
                    {(currentWidget.type !== 'image' && currentWidget.type !== 'map' && currentWidget.type !== 'card' && currentWidget.type !== 'table' && currentWidget.type !== 'alarms') && (
                      <div>
                        <label className="block text-sm font-medium text-[var(--accent-gray)] mb-2">Unit</label>
                        <input
                          type="text"
                          placeholder="Unit"
                          value={currentWidget.unit || ''}
                          onChange={e => update(currentWidgetIndex, 'unit', e.target.value)}
                          className={clsx(
                            "w-full bg-white border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] text-[var(--accent-gray)]",
                            (!currentWidget?.unit || !currentWidget.unit.trim()) && "border-red-400"
                          )}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-[var(--accent-gray)] mb-2">Widget Type</label>
                      <select
                        value={currentWidget?.type || 'bar'}
                        onChange={e => update(currentWidgetIndex, "type", e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] text-[var(--accent-gray)]"
                      >
                        <option value="bar">Bar Graph</option>
                        <option value="line">Line Chart</option>
                        <option value="donut">Donut</option>
                        <option value="pie">Pie Chart</option>
                        <option value="card">Value Card</option>
                        <option value="table">Table</option>
                        <option value="map">Map</option>
                        <option value="alarms">Alarms</option>
                        {userAuthority === 'TENANT_ADMIN' && <option value="image">Image</option>}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Data Parameters Section */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm">
                  {currentWidget.type !== 'alarms' && currentWidget.type !== 'image' && (
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-[var(--accent-gray)]">Data Parameters</h3>
                      <button
                        type="button"
                        onClick={() => addParam(currentWidgetIndex)}
                        className="inline-flex items-center text-blue-700 px-3 sm:px-4 py-2 rounded-lg bg-[var(--text-inverted)] hover:bg-blue-100 font-medium text-xs sm:text-sm border border-blue-200 transition-colors w-full sm:w-auto justify-center sm:justify-start"
                      >
                        <FiPlus size={16} className="mr-2 text-[var(--accent-gray)]" />
                        <span className="text-[var(--accent-gray)]">Add Parameter</span>
                      </button>
                    </div>)}

                  {currentWidget?.parameters?.length === 0 && currentWidget.type !== 'alarms' ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-[var(--accent-gray)] mb-2">No parameters configured</p>
                      <p className="text-sm text-gray-500">
                        Add at least one parameter to display data in this widget.
                      </p>
                    </div>
                  ) : currentWidget.type === 'alarms' ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-[var(--accent-gray)] mb-2">No parameters needed</p>
                    </div>
                  ) : currentWidget.type === 'image' ? (
                    <div className="p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-[var(--text-inverted)] mb-4 text-sm sm:text-base">Image Source</p>
                      <label className="block text-sm font-medium text-gray-700">Select Image:</label>
                      <div className='flex flex-col gap-2 md:flex md:flex-row md:items-center'>
                        <select
                          value={currentWidget.parameters[0]?.imageId || ''}
                          onChange={e => updateImageParam(currentWidgetIndex, 'imageId', e.target.value)}
                          className="w-full border rounded-lg p-2 focus:ring-blue-400"
                        >
                          <option value="">-- Select Image --</option>
                          {availableImages.map(img => (
                            <option key={img.id} value={img.id}>
                              {img.title}
                            </option>
                          ))}
                        </select>
                        <input type="file" id={`new-image-file-${currentWidget.id}`} accept="image/*"
                          onChange={e => {
                            const file = e.target.files[0];
                            if (file) {
                              setNewImageFile(file);
                              setNewImageTitle(file.name.replace(/\.[^/.]+$/, "")); // filename without extension
                            }
                          }}
                          className="w-full text-sm file:bg-blue-100 text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-2  00"
                        />
                        <button
                          type="button"
                          onClick={() => handleImageUpload(currentWidget.id)}
                          disabled={uploadingImage || !newImageFile}
                          className={clsx(
                            "inline-flex items-center px-4 py-2 border border-transparent text-sm rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                            (uploadingImage || !newImageFile) && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {uploadingImage ? 'Uploading...' : <><FiUploadCloud size={28} className="mr-2" /> Upload Image</>}
                        </button>
                      </div>
                      {currentWidget.parameters[0]?.publicLink && (
                        <div className="text-sm mt-2 break-words cursor-pointer text-blue-500 w-max flex items-center"
                          onClick={() => {
                            setPreviewImageLink(currentWidget.parameters[0].publicLink);
                            setPreviewImageTitle(currentWidget.parameters[0].title);
                            setShowPreview(true);
                          }}
                        ><FaRegImage size={20} className='mr-2' />
                          Image Preview
                        </div>
                      )}
                    </div>
                  ) : currentWidget.type === 'map' ? (
                    <div className="space-y-4">
                      {currentWidget.parameters.map((p, pi) => (
                        <div
                          key={pi}
                          className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-[var(--accent-gray)] mb-1">Device</label>
                              <select
                                value={p.deviceId}
                                onChange={e => updateParam(currentWidgetIndex, pi, 'deviceId', e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[var(--accent-blue)] focus:outline-none text-[var(--accent-gray)]"
                              >
                                <option value="">Select Device</option>
                                {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[var(--accent-gray)] mb-1">Latitude</label>
                              <select
                                value={p.latKey}
                                onChange={e => updateParam(currentWidgetIndex, pi, 'latKey', e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[var(--accent-blue)] focus:outline-none text-[var(--accent-gray)]"
                                disabled={!p.deviceId}
                              >
                                <option value="">Select Key</option>
                                {(devices.find(d => d.id === p?.deviceId)?.keys || []).map(k => (
                                  <option key={k} value={k}>{k}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[var(--accent-gray)] mb-1">Longitude</label>
                              <select
                                value={p.lonKey}
                                onChange={e => updateParam(currentWidgetIndex, pi, 'lonKey', e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[var(--accent-blue)] focus:outline-none text-[var(--accent-gray)]"
                                disabled={!p.deviceId}
                              >
                                <option value="">Select Key</option>
                                {(devices.find(d => d.id === p?.deviceId)?.keys || []).map(k => (
                                  <option key={k} value={k}>{k}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => confirmDeleteParam(currentWidgetIndex, pi)}
                                className="w-full bg-red-500 hover:bg-red-600 text-white border p-2 rounded-lg transition-colors"
                                title="Remove Parameter"
                              >
                                <FiTrash2 size={16} className="mx-auto" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : currentWidget.type === 'table' ? (
                    <div className="space-y-4">
                      {currentWidget.parameters.map((p, pi) => {
                        const selectedDeviceKeys = devices.find(d => d.id === p.deviceId)?.keys || [];
                        const firstParamKeys = currentWidget.parameters[0]?.keys.map(k => k.key).sort();
                        const currentParamKeys = p.keys.map(k => k.key).sort();
                        const isInvalid = firstParamKeys && firstParamKeys.length > 0 && JSON.stringify(firstParamKeys) !== JSON.stringify(currentParamKeys);
                        return (
                          <div key={pi} className={clsx("flex flex-col gap-2 bg-white rounded-lg p-4 border border-gray-200 shadow-sm", {
                            'border-red-500 ring-2 ring-red-300': isInvalid
                          })}>
                            <div className="flex justify-between items-center">
                              <div>
                                <label className="block text-xs font-medium text-[var(--accent-gray)] mb-1">Device</label>
                                <select
                                  value={p?.deviceId || ''}
                                  onChange={e => handleDeviceChange(currentWidgetIndex, pi, e.target.value)}
                                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[var(--accent-blue)] focus:outline-none text-[var(--accent-gray)]"
                                >
                                  <option value="">Select Device</option>
                                  {devices.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                  ))}
                                </select>
                              </div>
                              <button
                                type="button"
                                onClick={() => { setWidgetToDelete(currentWidgetIndex); setParamToDelete(pi); setIsParamDelete(true); }}
                                className="ml-2 text-red-500 hover:text-red-700"
                              >
                                <FiTrash2 size={20} />
                              </button>
                            </div>
                            <div className="flex flex-col gap-2 p-3 border rounded-lg bg-gray-100">
                              <h5 className="text-sm font-semibold text-gray-800">Telemetry Keys:</h5>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                {selectedDeviceKeys.map(key => (
                                  <div key={key} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`key-${currentWidget.id}-${p.deviceId}-${key}`}
                                      checked={p.keys?.some(k => k.key === key) || false}
                                      onChange={e => handleTableKeyChange(currentWidgetIndex, key, e.target.checked)}
                                      className="form-checkbox"
                                    />
                                    <label htmlFor={`key-${currentWidget.id}-${p.deviceId}-${key}`} className="text-sm cursor-pointer">
                                      {key}
                                    </label>
                                    {p.keys?.some(k => k.key === key) && (
                                      <input
                                        type="text"
                                        placeholder="Unit"
                                        value={p.keys.find(k => k.key === key)?.unit || ''}
                                        onChange={e => handleTableUnitChange(currentWidgetIndex, key, e.target.value)}
                                        className="w-14 md:w-20 text-xs border rounded-md px-1"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {currentWidget?.parameters?.map((p, pi) => (
                        <div
                          key={pi}
                          className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-[var(--accent-gray)] mb-1">Device</label>
                              <select
                                value={p?.deviceId || ''}
                                onChange={e => updateParam(currentWidgetIndex, pi, 'deviceId', e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[var(--accent-blue)] focus:outline-none text-[var(--accent-gray)]"
                              >
                                <option value="">Select Device</option>
                                {devices.map(d => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-[var(--accent-gray)] mb-1">Key</label>
                              <select
                                value={p?.key || ''}
                                onChange={e => updateParam(currentWidgetIndex, pi, 'key', e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[var(--accent-blue)] focus:outline-none text-[var(--accent-gray)]"
                                disabled={!p?.deviceId}
                              >
                                <option value="">Select Key</option>
                                {(devices.find(d => d.id === p?.deviceId)?.keys || []).map(k => (
                                  <option key={k} value={k}>{k}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-[var(--accent-gray)] mb-1">Label</label>
                              <input
                                type="text"
                                placeholder="Display label"
                                value={p?.label || ''}
                                onChange={e => updateParam(currentWidgetIndex, pi, 'label', e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[var(--accent-blue)] focus:outline-none text-[var(--accent-gray)]"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {currentWidget.type === 'card' && (
                              <div>
                                <label className="block text-xs font-medium text-[var(--accent-gray)] mb-1">Unit</label>
                                <input
                                  type="text"
                                  placeholder="e.g. °C, %"
                                  value={p?.unit || ''}
                                  onChange={e => updateParam(currentWidgetIndex, pi, 'unit', e.target.value)}
                                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[var(--accent-blue)] focus:outline-none text-[var(--accent-gray)]"
                                />
                              </div>)}
                            <div>
                              <label className="block text-xs font-medium text-[var(--accent-gray)] mb-1">Min</label>
                              <input
                                type="number"
                                placeholder="Min Value"
                                value={p?.min || ''}
                                onChange={e => updateParam(currentWidgetIndex, pi, 'min', e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[var(--accent-blue)] focus:outline-none text-[var(--accent-gray)]"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-[var(--accent-gray)] mb-1">Max</label>
                              <input
                                type="number"
                                placeholder="Max Value"
                                value={p?.max || ''}
                                onChange={e => updateParam(currentWidgetIndex, pi, 'max', e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[var(--accent-blue)] focus:outline-none text-[var(--accent-gray)]"
                              />
                            </div>

                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => confirmDeleteParam(currentWidgetIndex, pi)}
                                className="w-full bg-red-500 hover:bg-red-600 text-white border p-2 rounded-lg transition-colors"
                                title="Remove Parameter"
                              >
                                <FiTrash2 size={16} className="mx-auto" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Popups */}
      {isDeletePopupOpen && (
        <DeletePopup
          onConfirm={() => {
            removeWidget(widgetToDelete);
            setIsDeletePopupOpen(false);
            setWidgetToDelete(null);
          }}
          onCancel={() => {
            setIsDeletePopupOpen(false);
            setWidgetToDelete(null);
          }}
        />
      )}

      {isParamDelete && (
        <DeletePopup
          onConfirm={() => {
            removeParam(widgetToDelete, paramToDelete);
            setIsParamDelete(false);
            setWidgetToDelete(null);
            setParamToDelete(null);
          }}
          onCancel={() => {
            setIsParamDelete(false);
            setWidgetToDelete(null);
            setParamToDelete(null);
          }}
        />
      )}
      {showPreview && (
        <ShowPreviewModal
          ImgUrl={previewImageLink}
          title={previewImageTitle}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}