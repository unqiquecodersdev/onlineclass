import React, { useState } from "react";
import { Classroom, Meeting } from "../types";
import { BookOpen, Copy, Check, Calendar, Plus, Link, Video, AlertCircle, ArrowRight } from "lucide-react";

interface ClassroomCardProps {
  classroom: Classroom;
  activeMeetings: Meeting[];
  userRole: "student" | "teacher" | "admin";
  onSelect: () => void;
  onJoinMeeting: (meeting: Meeting) => void;
}

export const ClassroomCard: React.FC<ClassroomCardProps> = ({
  classroom,
  activeMeetings,
  userRole,
  onSelect,
  onJoinMeeting,
}) => {
  const [copied, setCopied] = useState(false);

  // Filter meetings specifically belonging to this classroom
  const activeClassMeetings = activeMeetings.filter(
    (m) => m.classroomId === classroom.id && m.status === "active"
  );

  const copyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(classroom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      onClick={onSelect}
      className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:shadow-[0_0_25px_rgba(99,102,241,0.15)] hover:border-indigo-500/40 hover:scale-[1.005] transition-all cursor-pointer flex flex-col justify-between h-[210px] text-slate-200"
    >
      <div>
        <div className="flex items-start justify-between">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25">
            <BookOpen className="w-5 h-5 text-indigo-400" />
          </div>
          <button
            onClick={copyCode}
            className="px-2.5 py-1 text-[10px] font-mono font-medium rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-400 border border-white/5 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Copy Join Code"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-indigo-400" />}
            Join Code: <span className="font-bold text-slate-100">{classroom.code}</span>
          </button>
        </div>

        <h3 className="text-sm font-semibold text-slate-100 tracking-tight mt-4 truncate">
          {classroom.name}
        </h3>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {classroom.description || "No description provided for this online educational folder."}
        </p>
      </div>

      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-455">
          <span className="text-slate-400">Instructor:</span>
          <span className="font-semibold text-slate-200">{classroom.teacherName}</span>
        </div>

        {activeClassMeetings.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onJoinMeeting(activeClassMeetings[0]);
              }}
              className="py-1 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded-lg shadow-[0_0_12px_rgba(244,63,94,0.3)] transition-all flex items-center gap-1 cursor-pointer"
            >
              <Video className="w-3 h-3 animate-pulse" />
              Join Live
            </button>
          </div>
        ) : (
          <div className="text-[10px] text-slate-400 flex items-center gap-1 uppercase tracking-wider font-mono">
            <span>No Active Class</span>
            <ArrowRight className="w-3 h-3 text-indigo-400/50" />
          </div>
        )}
      </div>
    </div>
  );
};
