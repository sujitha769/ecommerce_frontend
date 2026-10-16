import { money } from '../context/CartContext';

export default function PriceSummary({ totals, children }) {
  return (
    <aside className="box summary">
      <h3>Price Details ({totals.count} item{totals.count !== 1 ? 's' : ''})</h3>
      <div className="line"><span>Total Product Price</span><span>{money(totals.mrp)}</span></div>
      <div className="line green"><span>Total Discounts</span><span>- {money(totals.discount)}</span></div>
      <div className="line"><span>Delivery Charges</span><span className="green">{totals.delivery ? money(totals.delivery) : 'FREE'}</span></div>
      <div className="line total"><span>Order Total</span><span>{money(totals.total)}</span></div>
      {totals.discount > 0 && <div className="saved">🎉 Yay! Your total discount is {money(totals.discount)}</div>}
      {children}
    </aside>
  );
}
