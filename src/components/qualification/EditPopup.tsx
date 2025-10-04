'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EditPopupProps {
  isOpen: boolean;
  onEdit: () => void;
  onContinue: () => void;
  department: string;
  countdown?: number; // Default 10 seconds
}

export function EditPopup({
  isOpen,
  onEdit,
  onContinue,
  department,
  countdown = 10
}: EditPopupProps) {
  const [timeRemaining, setTimeRemaining] = useState(countdown);
  const [isCountingDown, setIsCountingDown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeRemaining(countdown);
      setIsCountingDown(true);
    } else {
      setIsCountingDown(false);
    }
  }, [isOpen, countdown]);

  useEffect(() => {
    if (!isCountingDown || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-continue when countdown reaches 0
          onContinue();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCountingDown, timeRemaining, onContinue]);

  const handleEdit = () => {
    setIsCountingDown(false);
    onEdit();
  };

  const handleContinue = () => {
    setIsCountingDown(false);
    onContinue();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Review {department.charAt(0).toUpperCase() + department.slice(1)} Data
          </DialogTitle>
          <DialogDescription>
            The {department} department data is ready for qualification.
            You have {timeRemaining} seconds to review and edit if needed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center py-6">
          <div className="relative w-32 h-32">
            {/* Countdown Circle */}
            <svg className="transform -rotate-90 w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - timeRemaining / countdown)}`}
                className="text-blue-600 transition-all duration-1000 ease-linear"
              />
            </svg>

            {/* Countdown Number */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-blue-600">
                {timeRemaining}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={handleEdit}
            className="flex-1"
          >
            Edit Data
          </Button>
          <Button
            onClick={handleContinue}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Continue ({timeRemaining}s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for managing edit popup state
export function useEditPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState('');

  const showEditPopup = (department: string) => {
    setCurrentDepartment(department);
    setIsOpen(true);
  };

  const hideEditPopup = () => {
    setIsOpen(false);
    setCurrentDepartment('');
  };

  return {
    isOpen,
    currentDepartment,
    showEditPopup,
    hideEditPopup
  };
}
