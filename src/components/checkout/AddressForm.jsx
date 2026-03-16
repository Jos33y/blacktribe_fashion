import { useMemo } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { nigerianStates, getLGAsForState } from '../../utils/nigerianStates';

/**
 * AddressForm — Nigerian shipping address with dependent State → LGA dropdowns.
 * Controlled by parent via `address` object and `onChange` callback.
 */
export default function AddressForm({ address, onChange, errors = {} }) {
  const lgaOptions = useMemo(
    () => getLGAsForState(address.state),
    [address.state]
  );

  const handleField = (field, value) => {
    const updated = { ...address, [field]: value };
    // Reset LGA when state changes
    if (field === 'state') updated.lga = '';
    onChange(updated);
  };

  return (
    <div className="checkout-address">
      <Input
        label="Full Name"
        id="address-name"
        required
        value={address.fullName}
        onChange={(e) => handleField('fullName', e.target.value)}
        placeholder="Your full name"
        error={errors.fullName}
        autoComplete="name"
      />

      <Input
        label="Street Address"
        id="address-street"
        required
        value={address.street}
        onChange={(e) => handleField('street', e.target.value)}
        placeholder="House number and street"
        error={errors.street}
        autoComplete="street-address"
      />

      <Input
        label="City"
        id="address-city"
        required
        value={address.city}
        onChange={(e) => handleField('city', e.target.value)}
        placeholder="City"
        error={errors.city}
        autoComplete="address-level2"
      />

      <div className="checkout-address__row">
        <Select
          label="State"
          id="address-state"
          options={nigerianStates}
          value={address.state}
          onChange={(e) => handleField('state', e.target.value)}
          placeholder="Select state"
          error={errors.state}
          className="checkout-address__half"
        />

        <Select
          label="LGA"
          id="address-lga"
          options={lgaOptions}
          value={address.lga}
          onChange={(e) => handleField('lga', e.target.value)}
          placeholder={address.state ? 'Select LGA' : 'Select state first'}
          disabled={!address.state}
          error={errors.lga}
          className="checkout-address__half"
        />
      </div>

      <Input
        label="Phone"
        id="address-phone"
        type="tel"
        value={address.phone}
        onChange={(e) => handleField('phone', e.target.value)}
        placeholder="+234 800 000 0000"
        autoComplete="tel"
      />
    </div>
  );
}
