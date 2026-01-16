import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User, Bot, Sparkles, Check, Loader2, Minimize2, Maximize2, Trash2, Key, Monitor, MonitorOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { sendMessage, type ChatMessage } from '../lib/gemini';
import type { AIAction, SuggestCampaignData } from '../lib/aiActions';
import { addDays } from 'date-fns';

export function Coach() {
	const [isOpen, setIsOpen] = useState(false);
	const [isMinimized, setIsMinimized] = useState(false);
	const [isTheaterMode, setIsTheaterMode] = useState(false);
	const [apiKey, setApiKey] = useState(() => localStorage.getItem('mex_gemini_api_key') || '');
	const [messages, setMessages] = useState<ChatMessage[]>(() => {
		const saved = localStorage.getItem('mex_coach_history');
		return saved ? JSON.parse(saved) : [
			{ role: 'model', text: "Systems online. I am your Strategy Coach. Ready to optimize your trajectory.", timestamp: Date.now() }
		];
	});
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	// Store pending actions to allow user to commit them
	const [pendingAction, setPendingAction] = useState<AIAction | null>(null);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const { addCampaign, profile, campaigns, exams, skillDefinitions, habitDefinitions } = useData();
	const { showToast } = useToast();

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages, isOpen, pendingAction, apiKey, isTheaterMode]);

	// Persist messages
	useEffect(() => {
		localStorage.setItem('mex_coach_history', JSON.stringify(messages));
	}, [messages]);

	const saveApiKey = (key: string) => {
		setApiKey(key);
		localStorage.setItem('mex_gemini_api_key', key);
		if (key) showToast('Security clearance updated.', 'success');
	};

	const clearHistory = () => {
		const initialMsg: ChatMessage = { role: 'model', text: "Memory wiped. Ready for new protocols.", timestamp: Date.now() };
		setMessages([initialMsg]);
		localStorage.removeItem('mex_coach_history');
		showToast('Chat history cleared.', 'info');
	};

	const generateContext = () => {
		return `
USER PROFILE:
Name: ${profile?.name || 'User'}
Title: ${profile?.professional_title || 'User'}
Summary: ${profile?.professional_summary || 'No summary'}

ACTIVE CAMPAIGNS (Strategy):
${campaigns.length > 0 ? campaigns.map(c => `- ${c.name} (Status: ${c.status}) [Focus: ${c.focus_areas?.join(', ') || ''}]`).join('\n') : "No active campaigns."}

ACADEMICS / EXAMS:
${exams.length > 0 ? exams.map(e => `- ${e.name} (${e.cfu} CFU) - Status: ${e.status}`).join('\n') : "No exams tracked."}

SKILLS (Definitions):
${skillDefinitions.length > 0 ? skillDefinitions.map(s => `- ${s.name} (${s.category}) [Target: ${s.targetPerDay}]`).join('\n') : "No skills defined."}

HABITS:
${habitDefinitions.length > 0 ? habitDefinitions.map(h => `- ${h.name} (${h.trackingType})`).join('\n') : "No habits defined."}
`;
	};

	const handleSend = async () => {
		if (!input.trim() || isLoading) return;

		const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
		setMessages(prev => [...prev, userMsg]);
		setInput('');
		setIsLoading(true);
		setPendingAction(null); // Clear previous action when new turn starts

		// Pass recent history, ensuring we skip the initial welcome message (index 0) 
		// because Gemini requires the first history message to be from the 'user'.
		const history = messages.length > 0 && messages[0].role === 'model'
			? messages.slice(1).slice(-10)
			: messages.slice(-10);

		const context = generateContext();
		const response = await sendMessage(apiKey, [...history, userMsg], input, context);

		const botMsg: ChatMessage = { role: 'model', text: response.text, timestamp: Date.now() };
		setMessages(prev => [...prev, botMsg]);

		if (response.action) {
			setPendingAction(response.action);
		}

		setIsLoading(false);
	};

	const handleCommitAction = async () => {
		if (!pendingAction) return;

		try {
			switch (pendingAction.type) {
				case 'SUGGEST_CAMPAIGN': {
					const data = pendingAction.data as SuggestCampaignData;
					await addCampaign({
						name: data.name,
						status: 'planned',
						startDate: new Date().toISOString(),
						endDate: addDays(new Date(), data.duration_weeks * 7).toISOString(),
						focus_areas: data.focus_areas,
						linked_exams: [],
						linked_docs: [],
						rules: []
					});
					showToast(`Strategy '${data.name}' deployed successfully.`, 'success');
					break;
				}
				case 'SUGGEST_EXAM':
				case 'SUGGEST_SKILL':
				case 'SUGGEST_HABIT':
					// Future implementation
					showToast('Auto-commit not ready for this type yet. Please add manually.', 'warning');
					break;
			}
			setPendingAction(null); // Clear after commit
		} catch (error) {
			console.error("Failed to commit action", error);
			showToast('Failed to execute command.', 'error');
		}
	};

	if (!isOpen) {
		return (
			<button
				onClick={() => setIsOpen(true)}
				className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-neon-green/20 border border-neon-green text-neon-green hover:bg-neon-green/30 hover:shadow-[0_0_20px_rgba(0,255,136,0.5)] transition-all duration-300 group"
			>
				<MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
			</button>
		);
	}

	// Calculate container classes based on state
	let containerClasses = "fixed z-50 transition-all duration-300 bg-dark-800/95 backdrop-blur-xl border border-neon-green/30 shadow-2xl flex flex-col ";
	if (isMinimized) {
		containerClasses += "bottom-6 right-6 w-72 h-14 overflow-hidden rounded-full";
	} else if (isTheaterMode) {
		containerClasses += "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[85vh] max-w-5xl rounded-2xl";
	} else {
		containerClasses += "bottom-6 right-6 w-[22rem] sm:w-96 h-[32rem] rounded-xl";
	}

	return (
		<>
			{/* Backdrop for Theater Mode */}
			{isTheaterMode && !isMinimized && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsTheaterMode(false)} />
			)}

			<div className={containerClasses}>
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-dark-600 bg-dark-700/50">
					<div
						className="flex items-center gap-2 cursor-pointer"
						onClick={() => setIsMinimized(!isMinimized)}
					>
						<Sparkles className="w-5 h-5 text-neon-green animate-pulse" />
						<div>
							<h3 className="font-bold text-white text-sm">Personal Coach</h3>
							<span className="text-[10px] text-neon-green uppercase tracking-wider">v2.1 Online</span>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={() => {
								const key = prompt("Enter Google Gemini API Key:", apiKey);
								if (key !== null) saveApiKey(key);
							}}
							title="Set API Key"
							className={`p-1 transition-colors ${!apiKey ? 'text-neon-red animate-pulse' : 'text-gray-400 hover:text-neon-green'}`}
						>
							<Key className="w-4 h-4" />
						</button>
						
						{/* Theater Mode Toggle */}
						{!isMinimized && (
							<button
								onClick={() => setIsTheaterMode(!isTheaterMode)}
								title={isTheaterMode ? "Exit Theater Mode" : "Theater Mode"}
								className={`p-1 transition-colors ${isTheaterMode ? 'text-neon-cyan' : 'text-gray-400 hover:text-white'}`}
							>
								{isTheaterMode ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
							</button>
						)}

						<button
							onClick={clearHistory}
							title="Clear History"
							className="p-1 text-gray-400 hover:text-neon-red transition-colors"
						>
							<Trash2 className="w-4 h-4" />
						</button>
						<button
							onClick={() => setIsMinimized(!isMinimized)}
							className="p-1 text-gray-400 hover:text-white transition-colors"
						>
							{isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
						</button>
						<button
							onClick={() => setIsOpen(false)}
							className="p-1 text-gray-400 hover:text-neon-red transition-colors"
						>
							<X className="w-4 h-4" />
						</button>
					</div>
				</div>

				{/* Chat Area - Only visible if not minimized */}
				{!isMinimized && (
					<>
						{!apiKey ? (
							<div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
								<div className="w-12 h-12 rounded-full bg-neon-red/10 flex items-center justify-center text-neon-red mb-2">
									<Key className="w-6 h-6" />
								</div>
								<h3 className="text-white font-bold">Authentication Required</h3>
								<p className="text-xs text-gray-400">
									To proceed, please enter your Google Gemini API Key. The key is stored locally on your device.
								</p>
								<input
									type="password"
									placeholder="Paste API Key here..."
									className="w-full bg-dark-800 border border-dark-600 rounded px-3 py-2 text-sm text-white focus:border-neon-green focus:outline-none"
									onChange={(e) => saveApiKey(e.target.value)}
								/>
								<div className="p-2 bg-dark-800/50 rounded border border-dark-600">
									<p className="text-[10px] text-gray-500">
										Get a key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">Google AI Studio</a>
									</p>
								</div>
							</div>
						) : (
							<div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-transparent">
								{messages.map((msg, idx) => (
									<div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
										<div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-neon-green/20 text-neon-green'
											}`}>
											{msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
										</div>
										<div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
											<div className={`p-3 rounded-lg text-sm leading-relaxed ${msg.role === 'user'
												? 'bg-dark-600 text-white rounded-tr-none'
												: 'bg-dark-700/80 text-gray-200 border border-dark-600 rounded-tl-none'
												}`}>
												{/* Markdown Rendering */}
												<ReactMarkdown 
													remarkPlugins={[remarkGfm]}
													components={{
														p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
														ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
														ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
														li: ({node, ...props}) => <li className="mb-1" {...props} />,
														strong: ({node, ...props}) => <strong className="text-neon-green font-bold" {...props} />,
														code: ({node, ...props}) => <code className="bg-dark-900 px-1 py-0.5 rounded text-xs font-mono text-neon-yellow" {...props} />,
													}}
												>
													{msg.text}
												</ReactMarkdown>
											</div>
											<span className="text-[10px] text-gray-500">
												{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											</span>
										</div>
									</div>
								))}

								{/* Action Card */}
								{pendingAction && (
									<div className="ml-11 max-w-[85%] border border-neon-yellow/30 bg-neon-yellow/5 rounded-lg p-3 animate-in fade-in slide-in-from-bottom-2">
										<div className="flex items-start gap-2 mb-2">
											<Sparkles className="w-4 h-4 text-neon-yellow mt-0.5" />
											<span className="text-xs font-bold text-neon-yellow uppercase">Suggested Action</span>
										</div>
										<p className="text-sm text-gray-300 mb-3 italic">"{pendingAction.reason}"</p>

										<div className="bg-dark-800/50 rounded border border-dashed border-dark-500 p-2 mb-3">
											<div className="text-xs text-gray-400 uppercase mb-1">Payload</div>
											<pre className="text-xs text-neon-cyan font-mono overflow-x-auto">
												{JSON.stringify(pendingAction.data, null, 2)}
											</pre>
										</div>

										<div className="flex gap-2">
											<button
												onClick={handleCommitAction}
												className="flex-1 btn-cyber py-1.5 text-xs flex items-center justify-center gap-1 bg-neon-green/10 border-neon-green/40 hover:bg-neon-green/20"
											>
												<Check className="w-3 h-3" />
												Accept & Commit
											</button>
											<button
												onClick={() => setPendingAction(null)}
												className="px-3 py-1.5 rounded border border-dark-600 text-gray-400 hover:text-white hover:bg-dark-600 text-xs transition-colors"
											>
												Dismiss
											</button>
										</div>
									</div>
								)}

								{isLoading && (
									<div className="flex gap-3">
										<div className="w-8 h-8 rounded-full bg-neon-green/20 text-neon-green flex items-center justify-center animate-pulse">
											<Bot className="w-4 h-4" />
										</div>
										<div className="flex items-center gap-1 h-8">
											<div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
											<div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
											<div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
										</div>
									</div>
								)}
								<div ref={messagesEndRef} />
							</div>
						)}

						{/* Input Area */}
						{apiKey && (
							<div className="p-4 border-t border-dark-600 bg-dark-700/30">
								<div className="flex gap-2">
									<input
										type="text"
										value={input}
										onChange={(e) => setInput(e.target.value)}
										onKeyDown={(e) => e.key === 'Enter' && handleSend()}
										placeholder="Ask for strategy or advice..."
										disabled={isLoading}
										className="flex-1 bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-green focus:outline-none transition-colors disabled:opacity-50"
									/>
									<button
										onClick={handleSend}
										disabled={isLoading || !input.trim()}
										className="p-2 bg-neon-green/10 border border-neon-green/50 text-neon-green rounded-lg hover:bg-neon-green/20 hover:border-neon-green disabled:opacity-50 disabled:cursor-not-allowed transition-all"
									>
										{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
									</button>
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</>
	);
}
