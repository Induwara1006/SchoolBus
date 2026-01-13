import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import './ServiceAgreement.css';

const ServiceAgreement = ({ requestData, onAgreementCreated, onCancel }) => {
  const [agreementForm, setAgreementForm] = useState({
    monthlyAmount: '',
    currency: 'USD',
    pickupTime: requestData?.preferredTime || '',
    pickupAddress: requestData?.pickupAddress || '',
    dropoffAddress: requestData?.dropoffAddress || '',
    contractDuration: 12, // months
    paymentDueDate: 1, // 1st of each month
    terms: `Monthly School Transport Service Agreement

Service Details:
• Daily pickup and drop-off service for school transportation
• Service provided Monday through Friday during school term
• Pick up time: [TO BE FILLED]
• Monthly payment due on the 1st of each month

Driver Responsibilities:
• Provide safe and reliable transportation
• Maintain vehicle in good condition
• Follow agreed pickup/drop-off schedule
• Notify parent of any delays or issues
• Ensure child safety during transport

Parent Responsibilities:
• Ensure monthly payment on time
• Have child ready at designated pickup time
• Provide emergency contact information
• Notify driver of any absence in advance

Cancellation Policy:
• Either party may cancel with 30 days written notice
• Pro-rated refund for unused portion of month
• No refund for services already provided

This agreement is valid for 12 months from the start date and automatically renews unless cancelled.`,
    startDate: new Date().toISOString().split('T')[0],
    autoRenewal: true
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAgreementForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateAgreement = async () => {
    try {
      const agreementId = `agreement_${Date.now()}`;
      const agreement = {
        id: agreementId,
        parentId: requestData.parentId,
        driverId: auth.currentUser.uid,
        childId: requestData.childId || `child_${Date.now()}`,
        childName: requestData.childName,
        childAge: requestData.childAge,
        monthlyAmount: parseFloat(agreementForm.monthlyAmount),
        currency: agreementForm.currency,
        pickupTime: agreementForm.pickupTime,
        pickupAddress: agreementForm.pickupAddress,
        dropoffAddress: agreementForm.dropoffAddress,
        contractDuration: agreementForm.contractDuration,
        paymentDueDate: agreementForm.paymentDueDate,
        terms: agreementForm.terms,
        startDate: new Date(agreementForm.startDate),
        endDate: new Date(new Date(agreementForm.startDate).setMonth(
          new Date(agreementForm.startDate).getMonth() + agreementForm.contractDuration
        )),
        autoRenewal: agreementForm.autoRenewal,
        status: 'pending_parent_signature',
        driverSignedAt: new Date(),
        parentSignedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'serviceAgreements', agreementId), agreement);

      // Update the original request to show agreement created
      if (requestData.requestId) {
        await setDoc(doc(db, 'transportRequests', requestData.requestId), {
          ...requestData,
          status: 'agreement_created',
          agreementId: agreementId,
          updatedAt: new Date()
        });
      }

      onAgreementCreated(agreement);
    } catch (error) {
      console.error('Error creating agreement:', error);
      alert('Error creating agreement. Please try again.');
    }
  };

  return (
    <div className="service-agreement-modal">
      <div className="agreement-content">
        <h2>Create Service Agreement</h2>
        <p className="muted">Set up a monthly contract for school transport services</p>

        <div className="agreement-form">
          <div className="form-section">
            <h3>Service Details</h3>
            <div className="form-grid">
              <div className="field">
                <label>Child Name</label>
                <input type="text" value={requestData?.childName || ''} disabled />
              </div>
              <div className="field">
                <label>Monthly Amount ($)</label>
                <input 
                  type="number" 
                  name="monthlyAmount"
                  value={agreementForm.monthlyAmount}
                  onChange={handleInputChange}
                  placeholder="e.g. 150"
                  required
                />
              </div>
              <div className="field">
                <label>Pickup Time</label>
                <input 
                  type="time" 
                  name="pickupTime"
                  value={agreementForm.pickupTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="field">
                <label>Contract Duration (months)</label>
                <select 
                  name="contractDuration"
                  value={agreementForm.contractDuration}
                  onChange={handleInputChange}
                >
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                  <option value={24}>24 months</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Addresses</h3>
            <div className="field">
              <label>Pickup Address</label>
              <input 
                type="text" 
                name="pickupAddress"
                value={agreementForm.pickupAddress}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="field">
              <label>Drop-off Address</label>
              <input 
                type="text" 
                name="dropoffAddress"
                value={agreementForm.dropoffAddress}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Payment Terms</h3>
            <div className="form-grid">
              <div className="field">
                <label>Payment Due Date</label>
                <select 
                  name="paymentDueDate"
                  value={agreementForm.paymentDueDate}
                  onChange={handleInputChange}
                >
                  <option value={1}>1st of each month</option>
                  <option value={15}>15th of each month</option>
                </select>
              </div>
              <div className="field">
                <label>Start Date</label>
                <input 
                  type="date" 
                  name="startDate"
                  value={agreementForm.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="field">
              <label>
                <input 
                  type="checkbox" 
                  name="autoRenewal"
                  checked={agreementForm.autoRenewal}
                  onChange={handleInputChange}
                />
                Auto-renew contract at end of term
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>Terms & Conditions</h3>
            <textarea 
              name="terms"
              value={agreementForm.terms}
              onChange={handleInputChange}
              rows="10"
              className="terms-textarea"
            />
          </div>

          <div className="agreement-summary">
            <h3>Agreement Summary</h3>
            <div className="summary-details">
              <p><strong>Service:</strong> Daily school transport for {requestData?.childName}</p>
              <p><strong>Monthly Cost:</strong> ${agreementForm.monthlyAmount} USD</p>
              <p><strong>Contract Duration:</strong> {agreementForm.contractDuration} months</p>
              <p><strong>Total Value:</strong> ${(agreementForm.monthlyAmount * agreementForm.contractDuration).toFixed(2)} USD</p>
              <p><strong>Start Date:</strong> {new Date(agreementForm.startDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="agreement-actions">
            <button className="btn" onClick={onCancel}>
              Cancel
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleCreateAgreement}
              disabled={!agreementForm.monthlyAmount || !agreementForm.pickupTime}
            >
              Create Agreement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceAgreement;
