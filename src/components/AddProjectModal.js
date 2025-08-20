import React, { useState, useEffect } from 'react';

const AddProjectModal = ({ onAddProject }) => {
  const [show, setShow] = useState(false);
  const [crops, setCrops] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    crop: '',
    acreage: '',
    yieldAcre: '',
    marketPrice: '',
    costAcre: '',
    status: 'Planning',
    startDate: ''
  });

  useEffect(() => {
    const storedCrops = localStorage.getItem('crops');
    if (storedCrops) {
      setCrops(JSON.parse(storedCrops));
    }
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const estIncome = parseFloat(formData.acreage || 0) * parseFloat(formData.yieldAcre || 0) * parseFloat(formData.marketPrice || 0);
    const estCost = parseFloat(formData.acreage || 0) * parseFloat(formData.costAcre || 0);
    onAddProject({ ...formData, estIncome, estCost, id: Date.now() });
    setFormData({
      name: '',
      crop: '',
      acreage: '',
      yieldAcre: '',
      marketPrice: '',
      costAcre: '',
      status: 'Planning',
      startDate: ''
    });
    setShow(false);
  };

  return (
    <>
      <button
        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        onClick={() => setShow(true)}
      >
        Add Project
      </button>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={() => setShow(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-lg font-semibold mb-4">Add Project</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="border rounded px-3 py-2"
                placeholder="Project Name"
                required
              />
              <select
                name="crop"
                value={formData.crop}
                onChange={handleInputChange}
                className="border rounded px-3 py-2"
                required
              >
                <option value="">Select Crop</option>
                {crops.map((crop, index) => (
                  <option key={index} value={crop.name}>
                    {crop.name}
                  </option>
                ))}
              </select>
              <input
                name="acreage"
                value={formData.acreage}
                onChange={handleInputChange}
                className="border rounded px-3 py-2"
                placeholder="Acreage"
                type="number"
              />
              <input
                name="yieldAcre"
                value={formData.yieldAcre}
                onChange={handleInputChange}
                className="border rounded px-3 py-2"
                placeholder="Yield/Acre"
                type="number"
              />
              <input
                name="marketPrice"
                value={formData.marketPrice}
                onChange={handleInputChange}
                className="border rounded px-3 py-2"
                placeholder="Market Price"
                type="number"
              />
              <input
                name="costAcre"
                value={formData.costAcre}
                onChange={handleInputChange}
                className="border rounded px-3 py-2"
                placeholder="Cost/Acre"
                type="number"
              />
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="border rounded px-3 py-2"
              >
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
              <input
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="border rounded px-3 py-2"
                type="date"
              />
              <div className="flex justify-end mt-6">
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded mr-2"
                  onClick={() => setShow(false)}
                  type="button"
                >Cancel</button>
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                  type="submit"
                >Save Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddProjectModal;
