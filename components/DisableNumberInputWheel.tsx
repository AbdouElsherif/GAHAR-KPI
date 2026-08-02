'use client';

import { useEffect } from 'react';

export default function DisableNumberInputWheel() {
    useEffect(() => {
        const handleWheel = (event: WheelEvent) => {
            const target = event.target;
            if (!(target instanceof HTMLInputElement)) return;
            if (target.type !== 'number') return;

            target.blur();
        };

        document.addEventListener('wheel', handleWheel, { capture: true });
        return () => document.removeEventListener('wheel', handleWheel, { capture: true });
    }, []);

    return null;
}
