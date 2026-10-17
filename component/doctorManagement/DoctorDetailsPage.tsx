"use client";
import { ChatMetadataRecord } from "@/app/actions/chatMonitoring";
import { AppointmentRecord, DoctorRecord } from "@/app/actions/doctorManagement";
import { NotificationRecord, sendNotification } from "@/app/actions/notificationManagement";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaBell,
  FaCalendarAlt,
  FaCalendarCheck,
  FaFileAlt,
  FaIdBadge,
  FaMoneyBillWave,
  FaPaperPlane,
  FaPhone,
  FaStar,
  FaUserClock,
} from "react-icons/fa";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const REGION_LABELS: Record<string, string> = {
  south_asia: "South Asia",
  east_southeast_asia: "East & SE Asia",
  middle_east: "Middle East",
  africa: "Africa",
  europe: "Europe",
  north_america: "North America",
  south_america: "South America",
  oceania: "Oceania",
};

interface DoctorDetailsPageProps {
  doctor: DoctorRecord;
  appointments: AppointmentRecord[];
  chats: ChatMetadataRecord[];
  sentNotifications: NotificationRecord[];
}

const initial = (name?: string) => (name?.trim()?.[0]?.toUpperCase() ?? "?");

const DoctorDetailsPage = ({ doctor, appointments, chats, sentNotifications }: DoctorDetailsPageProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const paidChats = chats.filter((c) => c.paid);

  const [notifications, setNotifications] = useState<NotificationRecord[]>(sentNotifications);
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyBody, setNotifyBody] = useState("");
  const [sending, setSending] = useState(false);

  const border = isDarkMode ? "border-gray-700" : "border-gray-200";
  const divide = isDarkMode ? "divide-gray-700" : "divide-gray-200";
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const panelBg = isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    isDarkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-gray-50 border-gray-300 text-gray-900"
  }`;

  const formatDateTime = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
      : "—";

  const handleNotify = async () => {
    if (!notifyTitle.trim() || !notifyBody.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setSending(true);
    const response = await sendNotification(notifyTitle.trim(), notifyBody.trim(), "doctors", doctor.user._id);
    setSending(false);

    if (!response.success) {
      toast.error(response.error || "Failed to send notification");
      return;
    }
    toast.success(`Notification sent to Dr. ${doctor.user.name || "the doctor"}`);
    if (response.data) setNotifications((prev) => [response.data as NotificationRecord, ...prev]);
    setNotifyTitle("");
    setNotifyBody("");
  };

  return (
    <div className={`${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <button
        onClick={() => router.push("/doctors")}
        className={`mb-6 flex items-center gap-2 px-4 py-2 rounded-lg border ${
          isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-50"
        }`}
      >
        <FaArrowLeft /> Back to Doctors
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column: profile summary + notify */}
        <div className="lg:col-span-1 space-y-6">
          <div className={`rounded-lg shadow-sm border p-6 ${panelBg}`}>
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-3 ${isDarkMode ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-700"}`}>
                {initial(doctor.user.name)}
              </div>
              <h1 className="text-xl font-bold flex items-center gap-1.5">
                {doctor.user.name || "Doctor"}
                {doctor.featured && <FaStar className="text-yellow-500" title="Featured" />}
              </h1>
              <p className={`text-sm mt-0.5 ${muted}`}>{doctor.specialization || "Specialization not set"}</p>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                <span
                  className={`px-2 py-1 text-xs rounded-full capitalize ${
                    doctor.approvalStatus === "approved"
                      ? isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800"
                      : doctor.approvalStatus === "rejected"
                      ? isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800"
                      : isDarkMode ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {doctor.approvalStatus}
                </span>
                {doctor.suspended && (
                  <span className={`px-2 py-1 text-xs rounded-full ${isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-700"}`}>Suspended</span>
                )}
              </div>
            </div>

            <div className={`mt-5 pt-5 border-t space-y-2.5 text-sm ${border}`}>
              <div className="flex items-center gap-2">
                <FaPhone className={muted} size={12} />
                <span>{doctor.user.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaIdBadge className={muted} size={12} />
                <span>{doctor.registrationNumber || "No registration number"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaStar className={muted} size={12} />
                <span>{doctor.reviewCount > 0 ? `${doctor.avgRating.toFixed(1)} (${doctor.reviewCount} reviews)` : "No reviews yet"}</span>
              </div>
              {doctor.experienceYears !== undefined && doctor.experienceYears !== null && (
                <div className={muted}>{doctor.experienceYears} yrs experience</div>
              )}
            </div>
          </div>

          {/* Notify this doctor */}
          <div className={`rounded-lg shadow-sm border p-5 ${panelBg}`}>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
              <FaBell /> Notify This Doctor
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={notifyTitle}
                onChange={(e) => setNotifyTitle(e.target.value)}
                placeholder="Notification title"
                className={inputClass}
              />
              <textarea
                value={notifyBody}
                onChange={(e) => setNotifyBody(e.target.value)}
                placeholder="Message..."
                className={`${inputClass} h-24`}
              />
              <button
                onClick={handleNotify}
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <FaPaperPlane size={13} /> {sending ? "Sending..." : "Send Notification"}
              </button>
              <p className={`text-xs ${muted}`}>Only Dr. {doctor.user.name || "this doctor"} will see this — it won&apos;t go to other doctors.</p>
            </div>

            {notifications.length > 0 && (
              <div className={`mt-5 pt-5 border-t ${border}`}>
                <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${muted}`}>
                  Sent to This Doctor ({notifications.length})
                </h4>
                <div className={`divide-y ${divide} max-h-72 overflow-y-auto`}>
                  {notifications.map((n) => (
                    <div key={n._id} className="py-2.5">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className={`text-xs mt-0.5 ${muted}`}>{n.body}</p>
                      <p className={`text-[11px] mt-1 ${muted}`}>{formatDateTime(n.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: documents, pricing, availability, appointments, payments */}
        <div className="lg:col-span-2 space-y-8">
          {/* Verification documents */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
              <FaFileAlt /> Verification Documents
            </h3>
            {doctor.verificationDocuments && doctor.verificationDocuments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {doctor.verificationDocuments.map((url, i) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-3 py-2 rounded-lg border text-sm text-blue-600 hover:underline ${border} ${panelBg}`}
                  >
                    Document {i + 1}
                  </a>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${muted}`}>No verification documents submitted</p>
            )}
          </section>

          {/* Pricing */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
              <FaMoneyBillWave /> Consultation Pricing
            </h3>
            <div className={`rounded-lg border ${border} divide-y ${divide} ${panelBg}`}>
              <div className="px-4 py-3 flex justify-between text-sm">
                <span>Base fee</span>
                <span className="font-medium">{doctor.consultationFee ? `£${doctor.consultationFee}` : "Not set"}</span>
              </div>
              {doctor.regionalPricing && doctor.regionalPricing.length > 0 ? (
                doctor.regionalPricing.map((p) => (
                  <div key={p.region} className="px-4 py-3 flex justify-between text-sm">
                    <span>{REGION_LABELS[p.region] || p.region}</span>
                    <span className="font-medium">£{p.fee}</span>
                  </div>
                ))
              ) : (
                <div className={`px-4 py-3 text-sm ${muted}`}>No regional pricing set</div>
              )}
            </div>
          </section>

          {/* Availability */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
              <FaCalendarAlt /> Weekly Availability
            </h3>
            {doctor.availability && doctor.availability.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[...doctor.availability]
                  .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                  .map((slot) => (
                    <div key={`${slot.dayOfWeek}-${slot.startTime}`} className={`px-3 py-2 rounded-lg border text-sm ${border} ${panelBg}`}>
                      <div className="font-medium">{DAY_NAMES[slot.dayOfWeek]}</div>
                      <div className={muted}>{slot.startTime}–{slot.endTime}</div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className={`text-sm ${muted}`}>No available hours set yet</p>
            )}
          </section>

          {/* Appointments */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
              <FaCalendarCheck /> Appointments Booked ({appointments.length})
            </h3>
            {appointments.length > 0 ? (
              <div className={`rounded-lg border overflow-hidden ${panelBg}`}>
                <table className="w-full text-sm">
                  <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Patient</th>
                      <th className="text-left px-4 py-2 font-medium">Scheduled For</th>
                      <th className="text-left px-4 py-2 font-medium">Duration</th>
                      <th className="text-left px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${divide}`}>
                    {appointments.map((a) => (
                      <tr key={a._id}>
                        <td className="px-4 py-2">
                          <div className="font-medium">{a.patient?.name || "—"}</div>
                          <div className={`text-xs ${muted}`}>{a.patient?.phone}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">{formatDateTime(a.scheduledAt)}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{a.durationMinutes} min</td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 text-xs rounded-full capitalize ${
                              a.status === "scheduled"
                                ? isDarkMode ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-800"
                                : a.status === "completed"
                                ? isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800"
                                : isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={`text-sm ${muted}`}>No appointments booked yet</p>
            )}
          </section>

          {/* Payments */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
              <FaUserClock /> Patients Who Paid ({paidChats.length})
            </h3>
            {paidChats.length > 0 ? (
              <div className={`rounded-lg border overflow-hidden ${panelBg}`}>
                <table className="w-full text-sm">
                  <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Patient</th>
                      <th className="text-left px-4 py-2 font-medium">Fee</th>
                      <th className="text-left px-4 py-2 font-medium">Region</th>
                      <th className="text-left px-4 py-2 font-medium">Paid At</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${divide}`}>
                    {paidChats.map((c) => (
                      <tr key={c._id}>
                        <td className="px-4 py-2">
                          <div className="font-medium">{c.patient?.name || "—"}</div>
                          <div className={`text-xs ${muted}`}>{c.patient?.phone}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">{c.fee ? `£${c.fee}` : "Free"}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{c.region ? REGION_LABELS[c.region] || c.region : "—"}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{formatDateTime(c.paidAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={`text-sm ${muted}`}>No patients have paid for this doctor yet</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetailsPage;
