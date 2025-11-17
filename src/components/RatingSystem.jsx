import { useState } from 'react';
import { addDoc, collection, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { db, auth } from '../firebase';

export default function RatingSystem({ targetUserId, targetUserName, targetUserRole, tripId, onComplete }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [categories, setCategories] = useState({
    punctuality: 0,
    communication: 0,
    safety: 0,
    professionalism: 0
  });
  const [submitting, setSubmitting] = useState(false);

  const ratingLabels = {
    1: '😞 Poor',
    2: '😐 Fair',
    3: '🙂 Good',
    4: '😊 Very Good',
    5: '🤩 Excellent'
  };

  const categoryLabels = {
    punctuality: '⏰ Punctuality',
    communication: '💬 Communication',
    safety: '🛡️ Safety',
    professionalism: '👔 Professionalism'
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      // Add rating to database
      await addDoc(collection(db, 'ratings'), {
        ratedUserId: targetUserId,
        ratedUserName: targetUserName,
        ratedUserRole: targetUserRole,
        raterUserId: auth.currentUser.uid,
        raterEmail: auth.currentUser.email,
        tripId: tripId || null,
        rating,
        categories,
        review: review.trim(),
        createdAt: serverTimestamp()
      });

      // Update user's average rating
      const userRef = doc(db, 'users', targetUserId);
      await updateDoc(userRef, {
        totalRatings: increment(1),
        ratingSum: increment(rating),
        averageRating: increment(rating) // This will need to be calculated properly
      });

      alert(`Rating submitted successfully! Thank you for your feedback.`);
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, size = 40 }) => (
    <div style={{ display: 'flex', gap: 8 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoveredRating(star)}
          onMouseLeave={() => setHoveredRating(0)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: `${size}px`,
            padding: 0,
            transition: 'transform 0.2s ease',
            transform: (hoveredRating >= star || value >= star) ? 'scale(1.2)' : 'scale(1)'
          }}
        >
          {(hoveredRating >= star || value >= star) ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  );

  return (
    <div className="card" style={{ maxWidth: 600, margin: '20px auto' }}>
      <h3 style={{ marginBottom: 8 }}>
        Rate {targetUserRole === 'driver' ? 'Driver' : 'Service'}
      </h3>
      <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
        How was your experience with {targetUserName}?
      </p>

      {/* Overall Rating */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <label style={{ display: 'block', marginBottom: 16, fontWeight: 600, fontSize: '1.1em' }}>
          Overall Rating
        </label>
        <StarRating value={rating} onChange={setRating} />
        {rating > 0 && (
          <div style={{ 
            marginTop: 12, 
            fontSize: '1.2em', 
            fontWeight: 600,
            color: 'var(--primary)'
          }}>
            {ratingLabels[rating]}
          </div>
        )}
      </div>

      {/* Category Ratings */}
      {rating > 0 && (
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 16, fontWeight: 600 }}>
            Rate Specific Areas
          </label>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 8
              }}>
                <span style={{ fontSize: '0.95em', color: 'var(--text)' }}>{label}</span>
                <StarRating 
                  value={categories[key]} 
                  onChange={(val) => setCategories({ ...categories, [key]: val })}
                  size={24}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Text */}
      {rating > 0 && (
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Write a Review (Optional)
          </label>
          <textarea
            className="input"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your experience to help others..."
            rows="4"
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
      )}

      {/* Submit Button */}
      <button
        className="btn btn-primary"
        onClick={handleSubmitRating}
        disabled={rating === 0 || submitting}
        style={{ 
          width: '100%', 
          padding: '14px',
          fontSize: '1.05em',
          opacity: rating === 0 ? 0.5 : 1
        }}
      >
        {submitting ? '📤 Submitting...' : '⭐ Submit Rating'}
      </button>

      {/* Rating Info */}
      <p style={{ 
        marginTop: 16, 
        fontSize: '0.85em', 
        color: 'var(--muted)', 
        textAlign: 'center' 
      }}>
        Your honest feedback helps improve our service quality
      </p>
    </div>
  );
}
