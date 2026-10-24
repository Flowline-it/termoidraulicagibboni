import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import pb, { IS_DEMO } from '@/lib/pocketbaseClient';

const DemoBanner = () => {
	const [confirming, setConfirming] = useState(false);

	if (!IS_DEMO) return null;

	const reset = () => {
		if (!confirming) {
			setConfirming(true);
			return;
		}
		pb.resetDemoData();
		window.location.reload();
	};

	return (
		<div className="relative z-40 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-accent px-4 py-2 text-center text-xs text-accent-foreground md:ml-60">
			<span>
				<strong className="font-semibold">Anteprima dimostrativa</strong> · dati di esempio, le modifiche restano solo su questo dispositivo.
			</span>
			<button
				type="button"
				onClick={reset}
				onBlur={() => setConfirming(false)}
				className="inline-flex items-center gap-1 rounded-sm border border-white/50 px-2 py-0.5 font-medium hover:bg-white/15"
			>
				<RotateCcw className="h-3 w-3" />
				{confirming ? 'Conferma ripristino' : 'Ripristina dati demo'}
			</button>
		</div>
	);
};

export default DemoBanner;
