import React, { useState } from 'react';
import { Check, Edit2, Play, X } from 'lucide-react';

export default function PlanEditor({ initialPlan, onProceed, onCancel }) {
    const [plan, setPlan] = useState(initialPlan);
    const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'files'

    const updateTask = (index, value) => {
        const newTasks = [...plan.tasks];
        newTasks[index] = value;
        setPlan({ ...plan, tasks: newTasks });
    };

    const addTask = () => {
        setPlan({ ...plan, tasks: [...plan.tasks, "New Task"] });
    };

    const removeTask = (index) => {
        const newTasks = plan.tasks.filter((_, i) => i !== index);
        setPlan({ ...plan, tasks: newTasks });
    };

    return (
        <div className="flex flex-col h-full bg-[#0d1117] text-white p-6 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Project Plan
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Review and modify the plan before generation</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onProceed(plan)}
                        className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-600 hover:bg-green-500 font-semibold transition-all hover:shadow-lg hover:shadow-green-900/20"
                    >
                        <Play size={18} />
                        Proceed to Build
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-700 mb-6">
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`pb-2 px-4 transition-colors ${activeTab === 'tasks'
                            ? 'border-b-2 border-blue-500 text-blue-400'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                >
                    Tasks ({plan.tasks.length})
                </button>
                <button
                    onClick={() => setActiveTab('files')}
                    className={`pb-2 px-4 transition-colors ${activeTab === 'files'
                            ? 'border-b-2 border-blue-500 text-blue-400'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                >
                    Files ({plan.files.length})
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pr-2">
                {activeTab === 'tasks' ? (
                    <div className="space-y-3">
                        {plan.tasks.map((task, idx) => (
                            <div key={idx} className="flex gap-3 items-start group">
                                <div className="mt-3 w-5 h-5 rounded-full border-2 border-gray-600 flex items-center justify-center text-gray-600">
                                    <span className="text-xs">{idx + 1}</span>
                                </div>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={task}
                                        onChange={(e) => updateTask(idx, e.target.value)}
                                        className="w-full bg-[#161b22] border border-gray-700 rounded-lg p-3 text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                    <button
                                        onClick={() => removeTask(idx)}
                                        className="absolute right-3 top-3 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={addTask}
                            className="w-full py-3 border-2 border-dashed border-gray-700 rounded-lg text-gray-500 hover:border-gray-500 hover:text-gray-300 transition-colors mt-4"
                        >
                            + Add Task
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {plan.files.map((file, idx) => (
                            <div key={idx} className="bg-[#161b22] border border-gray-700 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-yellow-400">📄</span>
                                    <span className="font-mono text-sm font-semibold">{file.name}</span>
                                </div>
                                <p className="text-sm text-gray-400">{file.description}</p>
                            </div>
                        ))}
                        <div className="p-4 flex items-center justify-center text-gray-500">
                            (File structure editing coming soon)
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
