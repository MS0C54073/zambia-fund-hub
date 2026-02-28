import { motion } from "framer-motion";

interface RealtimeProgressBarProps {
  raised: number;
  goal: number;
  className?: string;
  showLabel?: boolean;
}

const RealtimeProgressBar = ({ raised, goal, className = "", showLabel = true }: RealtimeProgressBarProps) => {
  const progress = goal > 0 ? Math.min(Math.round((raised / goal) * 100), 100) : 0;

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">
            K{raised >= 1000 ? `${(raised / 1000).toFixed(0)}k` : raised.toLocaleString()} raised
          </span>
          <span className="text-primary font-medium">{progress}%</span>
        </div>
      )}
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-gold rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-muted-foreground mt-1">
          Goal: K{goal >= 1000 ? `${(goal / 1000).toFixed(0)}k` : goal.toLocaleString()} ZMW
        </p>
      )}
    </div>
  );
};

export default RealtimeProgressBar;
