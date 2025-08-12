
import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';

const Settings = () => {
  const {
    theme, setTheme,
    fontSize, setFontSize,
    currency, setCurrency,
    language, setLanguage,
    notificationEmail, setNotificationEmail,
    notificationSMS, setNotificationSMS,
    displayName, setDisplayName,
    email, setEmail
  } = useSettings();

  const handleSave = (e) => {
    e.preventDefault();
    alert('Settings saved!');
  };

  const handleExport = async () => {
    window.open('http://localhost:5001/api/export', '_blank');
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('http://localhost:5001/api/import', {
      method: 'POST',
      body: formData
    });
    if (res.ok) {
      alert('Data imported successfully! Please reload the app.');
    } else {
      alert('Import failed.');
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      const res = await fetch('http://localhost:5001/api/reset', { method: 'POST' });
      if (res.ok) {
        alert('Data reset successfully! Please reload the app.');
      } else {
        alert('Reset failed.');
      }
    }
  };

  // 2FA state
  const [show2FA, setShow2FA] = useState(false);
  const [qr, setQR] = useState(null);
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [loginActivity, setLoginActivity] = useState([]);
  const [showActivity, setShowActivity] = useState(false);

  const handleEnable2FA = async () => {
    setShow2FA(true);
    // For demo, use displayName as username
    const res = await fetch('http://localhost:5001/api/2fa/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: displayName })
    });
    const data = await res.json();
    setQR(data.qr);
    setSecret(data.secret);
  };

  const handleVerify2FA = async () => {
    const res = await fetch('http://localhost:5001/api/2fa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: displayName, token })
    });
    const data = await res.json();
    setVerifyResult(data.verified);
  };

  const handleViewLoginActivity = async () => {
    setShowActivity(!showActivity);
    if (!showActivity) {
      const res = await fetch('http://localhost:5001/api/login-activity');
      const data = await res.json();
      setLoginActivity(data);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <form onSubmit={handleSave} className="space-y-6">
        {/* User Profile */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">User Profile</h3>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Display Name</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="border rounded px-3 py-2 w-full" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="border rounded px-3 py-2 w-full" />
          </div>
          <button type="button" className="bg-blue-500 text-white px-4 py-2 rounded">Change Password</button>
        </div>

        {/* Theme & Appearance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Theme & Appearance</h3>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Theme</label>
            <select value={theme} onChange={e => setTheme(e.target.value)} className="border rounded px-3 py-2 w-full">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Font Size</label>
            <select value={fontSize} onChange={e => setFontSize(e.target.value)} className="border rounded px-3 py-2 w-full">
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
          <div className="flex items-center mb-2">
            <input type="checkbox" checked={notificationEmail} onChange={e => setNotificationEmail(e.target.checked)} className="mr-2" />
            <span>Email Notifications</span>
          </div>
          <div className="flex items-center mb-2">
            <input type="checkbox" checked={notificationSMS} onChange={e => setNotificationSMS(e.target.checked)} className="mr-2" />
            <span>SMS Notifications</span>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Data Management</h3>
          <button type="button" className="bg-green-500 text-white px-4 py-2 rounded mr-2" onClick={handleExport}>Export Data</button>
          <label className="bg-blue-500 text-white px-4 py-2 rounded mr-2 cursor-pointer">
            Import Data
            <input type="file" accept="application/json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
          <button type="button" className="bg-red-500 text-white px-4 py-2 rounded" onClick={handleResetData}>Reset All Data</button>
        </div>

        {/* App Preferences */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">App Preferences</h3>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Default Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} className="border rounded px-3 py-2 w-full">
              <option value="KES">KES (Kenyan Shilling)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)} className="border rounded px-3 py-2 w-full">
              <option value="en">English</option>
              <option value="sw">Swahili</option>
            </select>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Security</h3>
          <button type="button" className="bg-yellow-500 text-white px-4 py-2 rounded mr-2" onClick={handleEnable2FA}>Enable 2FA</button>
          {show2FA && (
            <div className="mt-4">
              <p className="mb-2">Scan this QR code with your authenticator app:</p>
              {qr && <img src={qr} alt="2FA QR" className="mx-auto mb-2" style={{ width: 200 }} />}
              <p className="mb-2">Or enter secret: <span className="font-mono">{secret}</span></p>
              <input
                type="text"
                placeholder="Enter code from app"
                value={token}
                onChange={e => setToken(e.target.value)}
                className="border rounded px-3 py-2 w-48 mr-2"
              />
              <button type="button" className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleVerify2FA}>Verify</button>
              {verifyResult !== null && (
                <span className={verifyResult ? 'text-green-600 ml-4' : 'text-red-600 ml-4'}>
                  {verifyResult ? 'Verified!' : 'Invalid code'}
                </span>
              )}
            </div>
          )}
          <button type="button" className="bg-gray-500 text-white px-4 py-2 rounded ml-2" onClick={handleViewLoginActivity}>View Login Activity</button>
          {showActivity && (
            <div className="mt-4 max-h-48 overflow-y-auto">
              <h4 className="font-semibold mb-2">Recent Logins</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">User</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {loginActivity.map((a, i) => (
                    <tr key={i}>
                      <td>{a.username}</td>
                      <td className={a.status === 'success' ? 'text-green-600' : 'text-red-600'}>{a.status}</td>
                      <td>{new Date(a.time).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="text-right">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold">Save Settings</button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
