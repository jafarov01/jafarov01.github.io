import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useToast, type ToastType } from '../contexts/ToastContext';

const iconMap: Record<ToastType, React.ComponentType<{ className?: string }>> = {
	success: CheckCircle2,
	error: AlertCircle,
	warning: AlertTriangle,
	info: Info
};

const styleMap: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
	success: {
		bg: 'bg-neon-green/10',
		border: 'border-neon-green/30',
		text: 'text-white',
		icon: 'text-neon-green'
	},
	error: {
		bg: 'bg-neon-red/10',
		border: 'border-neon-red/30',
		text: 'text-white',
		icon: 'text-neon-red'
	},
	warning: {
		bg: 'bg-neon-yellow/10',
		border: 'border-neon-yellow/30',
		text: 'text-white',
		icon: 'text-neon-yellow'
	},
	info: {
		bg: 'bg-neon-cyan/10',
		border: 'border-neon-cyan/30',
		text: 'text-white',
		icon: 'text-neon-cyan'
	}
};

export function ToastContainer() {
	const { toasts, dismissToast } = useToast();

	if (toasts.length === 0) return null;

	return (
		<div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
			{toasts.map(toast => {
				const Icon = iconMap[toast.type];
				const styles = styleMap[toast.type];

				return (
					<div
						key={toast.id}
						className={`
							flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm
							${styles.bg} ${styles.border}
							animate-in slide-in-from-right fade-in duration-300
							shadow-lg shadow-black/20
						`}
					>
						<Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
						<p className={`flex-1 text-sm ${styles.text}`}>{toast.message}</p>
						<button
							onClick={() => dismissToast(toast.id)}
							className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
						>
							<X className="w-4 h-4" />
						</button>
					</div>
				);
			})}
		</div>
	);
}
