import FirebaseDebug from '@/components/FirebaseDebug';

export default function FirebaseDebugPage() {
  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Firebase Configuration Diagnostic</h1>
        <FirebaseDebug />
        
        <div className="mt-8 p-6 bg-white rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Manual Checklist</h2>
          <div className="space-y-2 text-sm">
            <p>✅ <strong>Firebase Console Checklist:</strong></p>
            <ul className="ml-6 space-y-1">
              <li>• Go to <a href="https://console.firebase.google.com/" target="_blank" className="text-blue-600">Firebase Console</a></li>
              <li>• Select project: <strong>greeny-corner</strong></li>
              <li>• Authentication → Sign-in method → Phone: <strong>Enabled?</strong></li>
              <li>• Authentication → Settings → Authorized domains: <strong>localhost added?</strong></li>
              <li>• Project Settings → Usage and billing: <strong>Blaze plan enabled?</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}