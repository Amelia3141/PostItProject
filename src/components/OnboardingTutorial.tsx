'use client';

import { useState, useEffect } from 'react';
import styles from './OnboardingTutorial.module.css';

interface TutorialStep {
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Welcome to AI Landscape Tool!',
    description: 'This quick tour will show you how to capture and organize ideas. You can skip this anytime or press ? to see keyboard shortcuts.',
    position: 'center',
  },
  {
    title: 'Add Your First Idea',
    description: 'Use the input bar at the top to quickly add new ideas. Type your thought, select a category and timeframe, then press Enter or click Add.',
    target: '[class*="quickAddContainer"]',
    position: 'bottom',
  },
  {
    title: 'Organize on the Board',
    description: 'Ideas are organized in a matrix with categories (rows) and timeframes (columns). Drag notes between cells to reorganize them.',
    target: '[class*="board"]',
    position: 'top',
  },
  {
    title: 'Vote on Ideas',
    description: 'Use the + and - buttons on each note to vote. The most popular ideas appear in the "Top Voted" section.',
    target: '[class*="topVoted"]',
    position: 'bottom',
  },
  {
    title: 'Switch Views',
    description: 'Toggle between Board view (matrix), Grid view (cards), and Flow view (connections) using these buttons.',
    target: '[class*="viewToggle"]',
    position: 'bottom',
  },
  {
    title: 'Connect Ideas in Flow View',
    description: 'In Flow view, drag from one note to another to create dependency arrows. Right-click connections to delete them.',
    position: 'center',
  },
  {
    title: 'AI Analysis',
    description: 'Click "AI Analysis" to get AI-powered insights including executive summaries, themes, sentiment analysis, and action items.',
    target: '[class*="aiBtn"]',
    position: 'bottom',
  },
  {
    title: 'Export Your Work',
    description: 'Export your ideas as JSON, CSV, PDF, or PowerPoint. You can also import previously exported JSON files.',
    target: '[class*="exportGroup"]',
    position: 'bottom',
  },
  {
    title: 'You\'re Ready!',
    description: 'That\'s the basics! Press N to add a new note, 1/2/3 to switch views, or ? to see all keyboard shortcuts. Happy ideating!',
    position: 'center',
  },
];

const STORAGE_KEY = 'ai-landscape-onboarding-completed';

interface OnboardingTutorialProps {
  forceShow?: boolean;
  onComplete?: () => void;
}

export function OnboardingTutorial({ forceShow = false, onComplete }: OnboardingTutorialProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Check if user has already completed onboarding
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed || forceShow) {
      setIsVisible(true);
      setCurrentStep(0);
    }
  }, [forceShow]);

  useEffect(() => {
    if (!isVisible) return;

    const step = tutorialSteps[currentStep];
    if (step.target) {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setHighlightRect(null);
      }
    } else {
      setHighlightRect(null);
    }
  }, [currentStep, isVisible]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible) return null;

  const step = tutorialSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  // Always center the tooltip for consistent positioning
  const getTooltipStyle = () => {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  };

  return (
    <div className={styles.overlay}>
      {/* Dark background - only show when no highlight */}
      {!highlightRect && <div className={styles.overlayBackground} />}

      {/* Highlight cutout - creates its own dark overlay via box-shadow */}
      {highlightRect && highlightRect.width > 0 && highlightRect.height > 0 && (
        <div
          className={styles.highlight}
          style={{
            top: highlightRect.top - 8,
            left: highlightRect.left - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16,
          }}
        />
      )}

      {/* Tooltip */}
      <div className={styles.tooltip} style={getTooltipStyle()}>
        <div className={styles.stepIndicator}>
          {currentStep + 1} of {tutorialSteps.length}
        </div>
        <h3 className={styles.title}>{step.title}</h3>
        <p className={styles.description}>{step.description}</p>
        <div className={styles.actions}>
          <button className={styles.skipBtn} onClick={handleSkip}>
            Skip Tour
          </button>
          <div className={styles.navButtons}>
            {!isFirstStep && (
              <button className={styles.prevBtn} onClick={handlePrev}>
                Back
              </button>
            )}
            <button className={styles.nextBtn} onClick={handleNext}>
              {isLastStep ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
        <div className={styles.progress}>
          {tutorialSteps.map((_, i) => (
            <div
              key={i}
              className={`${styles.progressDot} ${i === currentStep ? styles.active : ''} ${i < currentStep ? styles.completed : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Export a function to reset onboarding (for testing)
export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY);
}
