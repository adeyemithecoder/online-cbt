// import { useState } from "react";
// import { Settings, Save } from "lucide-react";
// import { useApp } from "../../context/AppContext";
// import { useToast } from "../../context/ToastContext";
// import { Button, Input, PageHeader, Card } from "../../components";

// export default function SettingsPage() {
//   const { accountingAuth } = useApp();
//   const { schoolId, currentSessionId, userId } = accountingAuth;

//   const toast = useToast();
//   const [form, setForm] = useState({
//     schoolId,
//     sessionId: currentSessionId,
//     userId,
//   });

//   const handleSave = () => {
//     setSchoolId(form.schoolId);
//     setCurrentSessionId(form.sessionId);
//     setUserId(form.userId);
//     toast.success("Settings saved successfully.");
//   };

//   return (
//     <div className="p-6 animate-fade-in">
//       <PageHeader
//         title="Settings"
//         subtitle="Configure your school and session context"
//         icon={<Settings size={20} />}
//       />

//       <div className="max-w-lg">
//         <Card>
//           <div className="space-y-5">
//             <div>
//               <h3 className="text-[14px] font-semibold text-white m-0 mb-4">
//                 Connection Settings
//               </h3>
//               <div className="space-y-4">
//                 <Input
//                   label="School ID"
//                   placeholder="Your school's MongoDB ObjectId..."
//                   value={form.schoolId}
//                   onChange={(e) =>
//                     setForm({ ...form, schoolId: e.target.value })
//                   }
//                   hint="The ID of your school in the database."
//                   required
//                 />
//                 <Input
//                   label="Current Session ID"
//                   placeholder="The active academic session ID..."
//                   value={form.sessionId}
//                   onChange={(e) =>
//                     setForm({ ...form, sessionId: e.target.value })
//                   }
//                   hint="Used to filter all session-specific data."
//                   required
//                 />
//                 <Input
//                   label="User ID"
//                   placeholder="Your user ObjectId..."
//                   value={form.userId}
//                   onChange={(e) => setForm({ ...form, userId: e.target.value })}
//                   hint="Used as the createdById for all actions."
//                   required
//                 />
//               </div>
//             </div>

//             <Button
//               leftIcon={<Save size={15} />}
//               onClick={handleSave}
//               className="w-full"
//             >
//               Save Settings
//             </Button>
//           </div>
//         </Card>
//       </div>
//     </div>
//   );
// }
