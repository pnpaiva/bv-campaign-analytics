import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface AnalyticsErrorProps {
  message?: string;
  onRetry?: () => void;
  onClose?: () => void;
}

export function AnalyticsError({ 
  message = 'No analytics data found for this campaign. Please add content URLs and try again.',
  onRetry,
  onClose 
}: AnalyticsErrorProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Analytics Error
            </h3>
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            <div className="flex gap-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick fix for the current error display
export function injectAnalyticsErrorFix() {
  // This function can be called to update the existing error modal
  // with better error handling
  
  if (typeof window !== 'undefined') {
    // Override the existing error display
    const checkForErrorModal = setInterval(() => {
      const errorModal = document.querySelector('.popup-overlay');
      if (errorModal && errorModal.textContent?.includes('No analytics data found')) {
        // Update the modal content
        const modalContent = errorModal.querySelector('.popup');
        if (modalContent) {
          modalContent.innerHTML = `
            <div class="flex items-start gap-4 p-6">
              <svg class="w-8 h-8 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Analytics Error</h3>
                <p class="text-gray-600 mb-4">
                  No analytics data found for this campaign. Please ensure:
                </p>
                <ul class="list-disc list-inside text-gray-600 space-y-1 mb-4">
                  <li>Content URLs have been added to the campaign</li>
                  <li>URLs are from supported platforms (YouTube, Instagram, TikTok)</li>
                  <li>Edge Functions are properly configured</li>
                </ul>
                <button 
                  onclick="this.closest('.popup-overlay').style.display='none'" 
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          `;
        }
        clearInterval(checkForErrorModal);
      }
    }, 100);
    
    // Clear after 5 seconds if not found
    setTimeout(() => clearInterval(checkForErrorModal), 5000);
  }
}

// Auto-inject fix when loaded
if (typeof window !== 'undefined') {
  injectAnalyticsErrorFix();
}