import React, { useState, useEffect } from 'react';

const AddProjectModal = ({ onAddProject }) => {
  const [show, setShow] = useState(false);
  const [crops, setCrops] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [projectCropData, setProjectCropData] = useState(null);
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
    
    // Fetch existing projects for dropdown
    const fetchProjects = async () => {
      try {
        const storedProjects = localStorage.getItem('projects');
        if (storedProjects) {
          setProjects(JSON.parse(storedProjects));
        }
        
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
        const response = await fetch(`${API_URL}/api/projects`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProjects(prev => [...prev, ...(Array.isArray(data) ? data : [])]);
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      }
    };
    
    fetchProjects();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // If crop is selected, auto-populate crop data
    if (name === 'crop' && value) {
      const allCrops = JSON.parse(localStorage.getItem('crops') || '[]');
      const selectedCrop = allCrops.find(crop => crop.name === value);
      
      if (selectedCrop) {
        setFormData({
          ...formData,
          [name]: value,
          yieldAcre: selectedCrop.avgYieldAcre || selectedCrop.yieldAcre || '',
          marketPrice: selectedCrop.marketPriceUnit || selectedCrop.marketPrice || '',
          costAcre: selectedCrop.avgCostAcre || selectedCrop.costAcre || ''
        });
        return;
      }
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const handleProjectSelect = (projectName) => {
    setSelectedProject(projectName);
    
    // Find the project and its associated crop
    const allProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = allProjects.find(p => p.name === projectName);
    
    if (project) {
      // Find crop data for this project's crop
      const allCrops = JSON.parse(localStorage.getItem('crops') || '[]');
      const crop = allCrops.find(c => c.name === project.crop);
      
      if (crop) {
        setProjectCropData({
          yieldAcre: crop.avgYieldAcre || crop.yieldAcre || '',
          marketPrice: crop.marketPriceUnit || crop.marketPrice || '',
          costAcre: crop.avgCostAcre || crop.costAcre || ''
        });
        
        // Auto-populate form fields
        setFormData(prev => ({
          ...prev,
          name: project.name || '',
          crop: project.crop || '',
          yieldAcre: crop.avgYieldAcre || crop.yieldAcre || '',
          marketPrice: crop.marketPriceUnit || crop.marketPrice || '',
          costAcre: crop.avgCostAcre || crop.costAcre || ''
        }));
      }
    }
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
    setSelectedProject('');
    setProjectCropData(null);
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
            
            {/* Project Selection Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Existing Project</label>
              <select
                value={selectedProject}
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="border rounded px-3 py-2 w-full"
              >
                <option value="">-- Select Project to View Details --</option>
                {projects.map((project, index) => (
                  <option key={index} value={project.name}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Crop Details Card */}
            {(projectCropData || formData.crop) && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border">
                <h4 className="text-md font-semibold text-blue-800 mb-2">
                  Crop Details {formData.crop ? `for ${formData.crop}` : `for ${selectedProject}`}
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-3 rounded shadow">
                    <label className="block text-xs font-medium text-gray-600">Yield/Acre</label>
                    <div className="text-lg font-bold text-blue-600">{formData.yieldAcre || projectCropData?.yieldAcre || 'N/A'}</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow">
                    <label className="block text-xs font-medium text-gray-600">Market Price</label>
                    <div className="text-lg font-bold text-green-600">${formData.marketPrice || projectCropData?.marketPrice || 'N/A'}</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow">
                    <label className="block text-xs font-medium text-gray-600">Cost/Acre</label>
                    <div className="text-lg font-bold text-red-600">${formData.costAcre || projectCropData?.costAcre || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}

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
              <div className="col-span-2 flex justify-end mt-6">
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded mr-2"
                  onClick={() => {
                    setShow(false);
                    setSelectedProject('');
                    setProjectCropData(null);
                  }}
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
