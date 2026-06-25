"use client";

import { m } from "framer-motion";

interface StepIndicatorProps {
  currentStep: number; // 1, 2, or 3
}

const steps = [
  { num: 1, label: "Date & Time" },
  { num: 2, label: "Choose Table" },
  { num: 3, label: "Confirm & Pay" },
];

/**
 * Premium 3-step progress indicator for the booking flow.
 */
export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-[480px] mx-auto">
      {steps.map((step, idx) => {
        const isActive = currentStep === step.num;
        const isCompleted = currentStep > step.num;

        return (
          <div key={step.num} className="flex items-center flex-1">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <m.div
                className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors duration-300"
                style={{
                  borderColor: isActive
                    ? "#BF976A"
                    : isCompleted
                    ? "#BF976A"
                    : "rgba(191,151,106,0.2)",
                  backgroundColor: isCompleted
                    ? "#BF976A"
                    : isActive
                    ? "rgba(191,151,106,0.12)"
                    : "transparent",
                }}
                animate={
                  isActive
                    ? { boxShadow: "0 0 20px rgba(191,151,106,0.3)" }
                    : { boxShadow: "0 0 0px rgba(191,151,106,0)" }
                }
                transition={{ duration: 0.3 }}
              >
                {isCompleted ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1D0F07"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span
                    className="font-mono-num text-xs font-medium"
                    style={{
                      color: isActive ? "#BF976A" : "rgba(191,151,106,0.35)",
                    }}
                  >
                    {step.num}
                  </span>
                )}
              </m.div>

              <span
                className="font-mono-num text-[9px] uppercase tracking-[0.2em] transition-colors duration-300 text-center whitespace-nowrap"
                style={{
                  color: isActive
                    ? "#BF976A"
                    : isCompleted
                    ? "#BF976A"
                    : "rgba(191,151,106,0.3)",
                }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line (except after the last step) */}
            {idx < steps.length - 1 && (
              <div className="relative h-0.5 flex-[0.6] -mt-5 mx-1">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: "rgba(191,151,106,0.15)" }}
                />
                <m.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ backgroundColor: "#BF976A" }}
                  initial={{ width: "0%" }}
                  animate={{
                    width: isCompleted ? "100%" : isActive ? "50%" : "0%",
                  }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
