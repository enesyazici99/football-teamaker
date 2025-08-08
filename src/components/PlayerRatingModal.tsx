'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Player {
  id: number;
  full_name: string;
  username: string;
}

interface PlayerRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rating: number, notes: string) => void;
  player: Player;
  currentRating?: number;
  currentNotes?: string;
}

export default function PlayerRatingModal({
  isOpen,
  onClose,
  onSave,
  player,
  currentRating = 0,
  currentNotes = ''
}: PlayerRatingModalProps) {
  const [rating, setRating] = useState(currentRating);
  const [notes, setNotes] = useState(currentNotes);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating: number) => {
    setHoveredRating(starRating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSave = () => {
    if (rating > 0) {
      onSave(rating, notes);
      onClose();
    }
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Çok Kötü';
      case 2: return 'Kötü';
      case 3: return 'Zayıf';
      case 4: return 'Orta Altı';
      case 5: return 'Orta';
      case 6: return 'Orta Üstü';
      case 7: return 'İyi';
      case 8: return 'Çok İyi';
      case 9: return 'Mükemmel';
      case 10: return 'Harika';
      default: return 'Puan Seçin';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full mx-4 border border-border">
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Oyuncu Puanla
            </h3>
            <Badge variant="secondary" className="text-sm">
              {player.full_name} (@{player.username})
            </Badge>
          </div>

          {/* Yıldız Puanlama */}
          <div className="text-center mb-6">
            <div className="flex justify-center space-x-1 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                  className="transition-all duration-200 hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            
            <Badge variant="outline" className="text-lg font-medium">
              {rating > 0 ? `${rating}/10` : '0/10'}
            </Badge>
            
            <p className="text-sm text-muted-foreground mt-2">
              {getRatingText(rating)}
            </p>
          </div>

          {/* Notlar */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Notlar (İsteğe bağlı)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Oyuncu hakkında notlarınızı yazın..."
              className="w-full px-3 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200 resize-none"
              rows={3}
            />
          </div>

          {/* Butonlar */}
          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              İptal
            </Button>
            <Button
              onClick={handleSave}
              disabled={rating === 0}
              className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              Puanı Kaydet
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 