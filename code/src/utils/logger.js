const { activityLog } = require('../config/database');

// Log activity to database
function logActivity(agentUid, action, details = {}) {
  try {
    activityLog.create.run({
      agent_uid: agentUid || null,
      action,
      details: JSON.stringify(details)
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// Get activity logs
function getActivityLogs(agentUid = null, limit = 100) {
  if (agentUid) {
    return activityLog.findByAgent.all(agentUid);
  }
  return activityLog.findAll.all();
}

module.exports = {
  logActivity,
  getActivityLogs
};
