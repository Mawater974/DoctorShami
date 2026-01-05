
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { dbService } from '../services/supabase';
import { Review, EntityType } from '../types';
import { Button, Card } from './UiComponents';
import { Star, MessageSquare, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ReviewsSectionProps {
  entityId: string;
  entityType: EntityType;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ entityId, entityType }) => {
  const { lang, user } = useStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [entityId]);

  const fetchReviews = async () => {
    try {
        const data = await dbService.getReviews(entityId);
        setReviews(data);
    } catch (error) {
        console.error("Failed to load reviews", error);
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0) return;
    
    setSubmitting(true);
    try {
        await dbService.createReview({
            entity_id: entityId,
            entity_type: entityType,
            user_id: user.id,
            rating,
            comment
        });
        // Reset and refresh
        setRating(0);
        setComment('');
        fetchReviews();
    } catch (error) {
        alert(lang === 'en' ? 'Error posting review' : 'خطأ في نشر التقييم');
    } finally {
        setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
           <h2 className="text-2xl font-bold flex items-center gap-2">
               <MessageSquare className="w-6 h-6 text-primary-600" />
               {lang === 'en' ? 'Reviews' : 'التقييمات'}
               <span className="text-gray-400 text-lg font-normal">({reviews.length})</span>
           </h2>
           
           {reviews.length > 0 && (
               <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                   <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                   <span className="font-bold text-lg text-yellow-700 dark:text-yellow-400">{averageRating}</span>
               </div>
           )}
       </div>

       {/* Write Review */}
       <Card className="p-6">
           {!user ? (
               <div className="text-center py-6">
                   <p className="text-gray-500 mb-4">{lang === 'en' ? 'Please sign in to write a review' : 'يرجى تسجيل الدخول لكتابة تقييم'}</p>
                   <Link to="/auth">
                       <Button>{lang === 'en' ? 'Sign In' : 'تسجيل الدخول'}</Button>
                   </Link>
               </div>
           ) : (
               <form onSubmit={handleSubmit} className="space-y-4">
                   <div className="flex flex-col gap-2">
                       <label className="text-sm font-medium">{lang === 'en' ? 'Your Rating' : 'تقييمك'}</label>
                       <div className="flex gap-1">
                           {[1, 2, 3, 4, 5].map((star) => (
                               <button
                                 key={star}
                                 type="button"
                                 onClick={() => setRating(star)}
                                 onMouseEnter={() => setHoverRating(star)}
                                 onMouseLeave={() => setHoverRating(0)}
                                 className="focus:outline-none transition-transform hover:scale-110"
                               >
                                   <Star 
                                     className={`w-8 h-8 ${star <= (hoverRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} 
                                   />
                               </button>
                           ))}
                       </div>
                   </div>
                   
                   <div>
                       <label className="text-sm font-medium mb-1 block">{lang === 'en' ? 'Comment (Optional)' : 'تعليق (اختياري)'}</label>
                       <textarea 
                           value={comment}
                           onChange={(e) => setComment(e.target.value)}
                           className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none min-h-[100px]"
                           placeholder={lang === 'en' ? 'Share your experience...' : 'شارك تجربتك...'}
                       />
                   </div>
                   
                   <div className="flex justify-end">
                       <Button type="submit" disabled={submitting || rating === 0}>
                           {submitting ? 'Posting...' : (lang === 'en' ? 'Post Review' : 'نشر التقييم')}
                       </Button>
                   </div>
               </form>
           )}
       </Card>

       {/* List Reviews */}
       <div className="space-y-4">
           {loading ? (
               <div className="text-center py-8 text-gray-500">Loading reviews...</div>
           ) : reviews.length === 0 ? (
               <div className="text-center py-8 text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                   {lang === 'en' ? 'No reviews yet. Be the first!' : 'لا توجد تقييمات بعد. كن الأول!'}
               </div>
           ) : (
               reviews.map(review => (
                   <div key={review.id} className="bg-white dark:bg-gray-950 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                       <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold">
                                   {review.user?.avatar_url ? (
                                       <img src={review.user.avatar_url} className="w-full h-full rounded-full object-cover" alt="User" />
                                   ) : (
                                       <User className="w-5 h-5" />
                                   )}
                               </div>
                               <div>
                                   <div className="font-bold text-sm">{review.user?.full_name || 'Anonymous'}</div>
                                   <div className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</div>
                               </div>
                           </div>
                           <div className="flex gap-0.5">
                               {[...Array(5)].map((_, i) => (
                                   <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 dark:text-gray-700'}`} />
                               ))}
                           </div>
                       </div>
                       {review.comment && (
                           <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 leading-relaxed">
                               {review.comment}
                           </p>
                       )}
                   </div>
               ))
           )}
       </div>
    </div>
  );
};
