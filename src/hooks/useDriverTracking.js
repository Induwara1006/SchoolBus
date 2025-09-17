import { useCallback, useEffect, useRef, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

export default function useDriverTracking() {
	const [isTracking, setIsTracking] = useState(false);
	const [lastError, setLastError] = useState(null);
	const watchIdRef = useRef(null);

	const stop = useCallback(() => {
		if (watchIdRef.current != null && navigator.geolocation) {
			navigator.geolocation.clearWatch(watchIdRef.current);
			watchIdRef.current = null;
		}
		setIsTracking(false);
	}, []);

	const start = useCallback(() => {
		setLastError(null);
		if (!('geolocation' in navigator)) {
			setLastError('Geolocation not supported');
			return;
		}
		try {
					const id = navigator.geolocation.watchPosition(
						async (pos) => {
							const { latitude, longitude } = pos.coords;
							try {
								const user = auth.currentUser;
								if (!user) return; // not signed-in

								// Get busId from localStorage (set in Driver page)
								const busId = localStorage.getItem('driver.busId');
								if (!busId) return; // not configured yet

								// Write to liveLocations/{busId}
								await setDoc(
									doc(db, 'liveLocations', busId),
									{
										lat: latitude,
										lng: longitude,
										updatedAt: serverTimestamp(),
										driverUid: user.uid,
									},
									{ merge: true }
								);
							} catch (e) {
								setLastError(e.message || String(e));
							}
						},
				(err) => {
					setLastError(err.message || String(err));
				},
				{ enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
			);
			watchIdRef.current = id;
			setIsTracking(true);
		} catch (e) {
			setLastError(e.message || String(e));
		}
	}, []);

	const toggleTracking = useCallback(() => {
		if (isTracking) stop();
		else start();
	}, [isTracking, start, stop]);

	useEffect(() => () => stop(), [stop]);

	return { isTracking, lastError, start, stop, toggleTracking };
}
