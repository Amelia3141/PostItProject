'use client';

import { useState, useEffect } from 'react';
import styles from './OnboardingTutorial.module.css';

interface TutorialStep {
  title: string;
  description: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Welcome to AI Landscape Tool!',
    description: 'This quick tour will show you how to capture and organize ideas. You can skip this anytime or press ? to see keyboard shortcuts.',
  },
  {
    title: 'Add Your First Idea',
    description: 'Use the input bar at the top to quickly add new ideas. Type your thought, select a category and timeframe, then press Enter or click Add.',
  },
  {
    title: 'Organize on the Board',
    description: 'Ideas are organized in a matrix with categories (rows) and timeframes (columns). Drag notes between cells to reorganize them.',
  },
  {
    title: 'Vote on Ideas',
    description: 'Use the + and - buttons on each note to vote. The most popular ideas appear in the "Top Voted" section.',
  },
  {
    title: 'Switch Views',
    description: 'Toggle between Board view (matrix), Grid view (cards), and Flow view (connections) using the buttons at the top.',
  },
  {
    title: 'Connect Ideas in Flow View',
    description: 'In Flow view, drag from one note to another to create dependency arrows. Right-click connections to delete them.',
  },
  {
    title: 'AI Analysis',
    description: 'Click "AI Analysis" to get AI-powered insights including executive summaries, themes, sentiment analysis, and action items.',
  },
  {
    title: 'Export Your Work',
    description: 'Export your ideas as JSON, CSV, PDF, or PowerPoint using the buttons in the secondary toolbar.',
  },
  {
    title: 'You\'re Ready!',
    description: 'That\'s the basics! Press N to add a new note, 1/2/3 to switch views, or ? to see all keyboard shortcuts. Happy ideating!',
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

  useEffect(() => {
    // Check if user has already completed onboarding
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed || forceShow) {
      setIsVisible(true);
      setCurrentStep(0);
    }
  }, [forceShow]);

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
      <div className={styles.overlayBackground} />

      {/* Tooltip - always centered */}
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
