import '../../styles/product/ScarcityIndicator.css';

export default function ScarcityIndicator({ showInventory, totalInventory, remainingInventory, preOrderDeadline }) {
  if (!showInventory && !preOrderDeadline) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="scarcity" role="status">
      {showInventory && totalInventory && (
        <p className="scarcity-text">
          Limited to {totalInventory} pieces.{' '}
          {remainingInventory !== undefined && (
            <span className="scarcity-remaining">{remainingInventory} remaining.</span>
          )}
        </p>
      )}
      {preOrderDeadline && (
        <p className="scarcity-text">Pre-order closes {formatDate(preOrderDeadline)}.</p>
      )}
    </div>
  );
}
