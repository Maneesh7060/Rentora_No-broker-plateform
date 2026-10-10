import api from './api';

/**
 * Submit a rental application
 */
export const submitApplication = async (applicationData) => {
  const response = await api.post('/applications', applicationData);
  return response.data;
};

/**
 * Get logged-in tenant's submitted applications
 */
export const getMyApplications = async (params = {}) => {
  const response = await api.get('/applications/my-applications', { params });
  return response.data;
};

/**
 * Get applications received by owner for their properties
 */
export const getReceivedApplications = async (params = {}) => {
  const response = await api.get('/applications/received', { params });
  return response.data;
};

/**
 * Get single application details by ID
 */
export const getApplicationById = async (id) => {
  const response = await api.get(`/applications/${id}`);
  return response.data;
};

/**
 * Update application status (Owner or Admin: 'approved' or 'rejected')
 */
export const updateApplicationStatus = async (id, status, ownerNotes = '') => {
  const response = await api.patch(`/applications/${id}/status`, {
    status,
    ownerNotes,
  });
  return response.data;
};

/**
 * Withdraw application (Tenant only)
 */
export const withdrawApplication = async (id) => {
  const response = await api.patch(`/applications/${id}/withdraw`);
  return response.data;
};

/**
 * Get tenant dashboard stats
 */
export const getTenantDashboardStats = async () => {
  const response = await api.get('/applications/tenant-stats');
  return response.data;
};

/**
 * Get owner application stats
 */
export const getOwnerDashboardStats = async () => {
  const response = await api.get('/applications/owner-stats');
  return response.data;
};
