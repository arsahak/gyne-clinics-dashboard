"use client";

import { getPlatformSettings, updatePlatformSettings } from "@/app/actions/platformSettings";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MdInfo, MdVideocam } from "react-icons/md";

export default function RecordingToggle() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [videoRecordingEnabled, setVideoRecordingEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const result = await getPlatformSettings();
      if (result.success && result.data) {
        setVideoRecordingEnabled(result.data.videoRecordingEnabled);
      } else {
        toast.error(result.error || "Failed to load settings");
      }
      setLoading(false);
    })();
  }, []);

  const handleToggle = async () => {
    if (saving) return;
    const next = !videoRecordingEnabled;
    setSaving(true);
    const result = await updatePlatformSettings({ videoRecordingEnabled: next });
    setSaving(false);

    if (!result.success) {
      toast.error(result.error || "Failed to update settings");
      return;
    }
    setVideoRecordingEnabled(next);
    toast.success(next ? "Recording enabled for new video calls" : "Recording disabled for new video calls");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <MdVideocam className="text-2xl text-blue-600" />
        <h1 className="text-xl font-semibold text-gray-800">Consultation Settings</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800">Record consultation video calls</p>
            <p className="text-sm text-gray-500 mt-1 max-w-md">
              When enabled, new appointment video calls are recorded for verification and quality
              purposes. This only applies to calls started after this setting is turned on —
              already-created appointments keep whatever setting was active when they were booked.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={videoRecordingEnabled}
            disabled={loading || saving}
            onClick={handleToggle}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
              videoRecordingEnabled ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                videoRecordingEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-start gap-2 mt-5 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <MdInfo className="text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800">
            Recording a medical consultation requires informing the patient and doctor beforehand.
            The mobile app shows a notice on the appointment when recording is enabled.
          </p>
        </div>
      </div>
    </div>
  );
}
