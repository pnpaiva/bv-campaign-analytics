import React from 'react';

export const UnauthorizedAccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8 border-4 border-red-500">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">
            ⚠️ UNAUTHORIZED ACCESS DETECTED ⚠️
          </h1>
          
          <div className="bg-red-100 border-2 border-red-300 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-red-800 mb-3">
              PROPRIETARY SYSTEM - BEYOND VIEWS INTERNAL USE ONLY
            </h2>
            <p className="text-red-700 mb-4">
              This is a private system containing confidential business information.
              Unauthorized access is strictly prohibited and may result in criminal prosecution.
            </p>
          </div>

          <div className="bg-gray-100 rounded-lg p-6 mb-6 text-left">
            <h3 className="text-lg font-semibold mb-3">Your access attempt has been logged with:</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>IP Address: {'{LOGGED}'}</li>
              <li>Timestamp: {new Date().toISOString()}</li>
              <li>Browser Information: {'{LOGGED}'}</li>
              <li>Location Data: {'{LOGGED}'}</li>
            </ul>
          </div>

          <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-yellow-800 mb-3">
              IMMEDIATE ACTION REQUIRED
            </h3>
            <ol className="list-decimal list-inside text-left text-yellow-700 space-y-2">
              <li>Close this browser window immediately</li>
              <li>Do not attempt to access this system again</li>
              <li>If you accessed this by mistake, report it to: legal@beyondviews.com</li>
              <li>Delete any information you may have obtained</li>
            </ol>
          </div>

          <div className="text-sm text-gray-600 mt-8">
            <p className="font-semibold mb-2">Legal Notice:</p>
            <p className="text-xs leading-relaxed">
              This system is protected under Brazilian and international law. Unauthorized access,
              use, or disclosure of information contained in this system is prohibited and may
              result in criminal and civil penalties under the Brazilian General Data Protection
              Law (LGPD), Copyright Law, and Criminal Code. Beyond Views reserves the right to
              monitor, intercept, and review all activities on this system.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-300">
            <p className="text-red-600 font-bold">
              For authorized access, contact your Beyond Views administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};