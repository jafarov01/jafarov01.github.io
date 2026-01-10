import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
	isOpen: boolean;
	title: string;
	message: string;
	onConfirm: () => void;
	onCancel: () => void;
	confirmText?: string;
	cancelText?: string;
	isDangerous?: boolean;
}

export function ConfirmModal({
	isOpen,
	title,
	message,
	onConfirm,
	onCancel,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	isDangerous = false
}: ConfirmModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
			<div className="bg-dark-800 border border-dark-600 rounded-xl w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
				<div className="p-6">
					<div className="flex items-center gap-3 mb-4">
						<div className={`p-3 rounded-full ${isDangerous ? 'bg-neon-red/10 text-neon-red' : 'bg-neon-yellow/10 text-neon-yellow'}`}>
							<AlertTriangle className="w-6 h-6" />
						</div>
						<h3 className="text-xl font-bold text-white">{title}</h3>
					</div>

					<p className="text-gray-400 mb-6 leading-relaxed">
						{message}
					</p>

					<div className="flex justify-end gap-3">
						<button
							onClick={onCancel}
							className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-medium"
						>
							{cancelText}
						</button>
						<button
							onClick={onConfirm}
							className={`px-6 py-2 rounded-lg font-bold transition-all ${isDangerous
								? 'bg-neon-red/20 text-neon-red border border-neon-red/50 hover:bg-neon-red hover:text-white'
								: 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan hover:text-dark-900'
								}`}
						>
							{confirmText}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
