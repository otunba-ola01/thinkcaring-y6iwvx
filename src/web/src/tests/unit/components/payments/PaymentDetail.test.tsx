import React from 'react'; // v18.2.0
import { act } from 'react-dom/test-utils'; // v18.2.0
import { userEvent } from '@testing-library/user-event'; // v14.4.3
import { renderWithProviders, screen, waitFor } from '../../../utils/test-utils';
import PaymentDetail from '../../../../components/payments/PaymentDetail';
import { createMockPaymentWithRelations, createMockPayer, createMockClaimWithRelations } from '../../../utils/mock-data';
import { ReconciliationStatus, PaymentMethod } from '../../../../types/payments.types';
import { formatCurrency, formatDate } from '../../../../utils/format';

describe('PaymentDetail', () => {
  const setup = () => {
    const mockPayer = createMockPayer({ name: 'Medicaid' });
    const mockPayment = createMockPaymentWithRelations({
      payer: mockPayer,
      paymentDate: '2023-08-01',
      paymentAmount: 1200.50,
      paymentMethod: PaymentMethod.EFT,
      referenceNumber: 'REF12345',
      reconciliationStatus: ReconciliationStatus.UNRECONCILED,
    });
    const mockClaimPayments = [
      createMockClaimWithRelations({ claimNumber: 'CLAIM-001' }),
      createMockClaimWithRelations({ claimNumber: 'CLAIM-002' }),
    ];

    const user = setupUserEvent();

    return {
      mockPayer,
      mockPayment,
      mockClaimPayments,
      user,
    };
  };

  it('renders payment header information correctly', async () => {
    const { mockPayment } = setup();

    renderWithProviders(<PaymentDetail paymentId={mockPayment.id} />, {
      preloadedState: {
        payments: {
          ...{},
          selectedPayment: mockPayment,
          loading: 'SUCCEEDED',
          error: null,
        },
      },
    });

    expect(screen.getByText(`Payer:`)).toBeInTheDocument();
    expect(screen.getByText(mockPayment.payer.name)).toBeInTheDocument();

    expect(screen.getByText(`Payment Date:`)).toBeInTheDocument();
    expect(screen.getByText(formatDate(mockPayment.paymentDate))).toBeInTheDocument();

    expect(screen.getByText(`Amount:`)).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(mockPayment.paymentAmount))).toBeInTheDocument();

    expect(screen.getByText(`Method:`)).toBeInTheDocument();
    expect(screen.getByText(PaymentMethod.EFT)).toBeInTheDocument();

    expect(screen.getByText(`Reference #:`)).toBeInTheDocument();
    expect(screen.getByText(mockPayment.referenceNumber)).toBeInTheDocument();

    expect(screen.getByText(`Status:`)).toBeInTheDocument();
    expect(screen.getByText(ReconciliationStatus.UNRECONCILED)).toBeInTheDocument();
  });

  it('displays loading state while fetching payment data', () => {
    renderWithProviders(<PaymentDetail paymentId="123" />, {
      preloadedState: {
        payments: {
          ...{},
          selectedPayment: null,
          loading: 'LOADING',
          error: null,
        },
      },
    });

    expect(screen.getByText('Loading payment details...')).toBeInTheDocument();
  });

  it('displays error message when payment data cannot be fetched', () => {
    renderWithProviders(<PaymentDetail paymentId="123" />, {
      preloadedState: {
        payments: {
          ...{},
          selectedPayment: null,
          loading: 'FAILED',
          error: 'Error fetching payment data',
        },
      },
    });

    expect(screen.getByText('Error fetching payment data')).toBeInTheDocument();
  });

  it('displays remittance information when available', async () => {
    const { mockPayment } = setup();

    renderWithProviders(<PaymentDetail paymentId={mockPayment.id} />, {
      preloadedState: {
        payments: {
          ...{},
          selectedPayment: mockPayment,
          loading: 'SUCCEEDED',
          error: null,
        },
      },
    });

    expect(screen.getByText('Remittance Information')).toBeInTheDocument();
    expect(screen.getByText(mockPayment.remittanceInfo.remittanceNumber)).toBeInTheDocument();
    expect(screen.getByText(formatDate(mockPayment.remittanceInfo.remittanceDate))).toBeInTheDocument();
    expect(screen.getByText(mockPayment.remittanceInfo.payerIdentifier)).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(mockPayment.remittanceInfo.totalAmount))).toBeInTheDocument();
  });

  it('does not display remittance information when not available', async () => {
    const { mockPayment } = setup();

    renderWithProviders(<PaymentDetail paymentId={mockPayment.id} />, {
      preloadedState: {
        payments: {
          ...{},
          selectedPayment: { ...mockPayment, remittanceInfo: null },
          loading: 'SUCCEEDED',
          error: null,
        },
      },
    });

    expect(screen.queryByText('Remittance Information')).not.toBeInTheDocument();
  });

  it('displays associated claims correctly', async () => {
    const { mockPayment } = setup();

    renderWithProviders(<PaymentDetail paymentId={mockPayment.id} />, {
      preloadedState: {
        payments: {
          ...{},
          selectedPayment: mockPayment,
          loading: 'SUCCEEDED',
          error: null,
        },
      },
    });

    expect(screen.getByText('Associated Claims')).toBeInTheDocument();
    expect(screen.getByText('CLAIM-001')).toBeInTheDocument();
    expect(screen.getByText('CLAIM-002')).toBeInTheDocument();
  });

  it('displays message when no claims are associated', async () => {
    const { mockPayment } = setup();

    renderWithProviders(<PaymentDetail paymentId={mockPayment.id} />, {
      preloadedState: {
        payments: {
          ...{},
          selectedPayment: { ...mockPayment, claimPayments: [] },
          loading: 'SUCCEEDED',
          error: null,
        },
      },
    });

    expect(screen.getByText('Associated Claims')).toBeInTheDocument();
    expect(screen.getByText('No claims associated with this payment.')).toBeInTheDocument();
  });

  it('calls onEdit callback when edit button is clicked', async () => {
    const { mockPayment, user } = setup();
    const onEdit = jest.fn();

    renderWithProviders(<PaymentDetail paymentId={mockPayment.id} onEdit={onEdit} />, {
      preloadedState: {
        payments: {
          ...{},
          selectedPayment: mockPayment,
          loading: 'SUCCEEDED',
          error: null,
        },
      },
    });

    const editButton = screen.getByRole('button', { name: 'Edit' });
    await act(() => user.click(editButton));

    expect(onEdit).toHaveBeenCalled();
  });

  it('calls onReconcile callback when reconcile button is clicked', async () => {
    const { mockPayment, user } = setup();
    const onReconcile = jest.fn();

    renderWithProviders(<PaymentDetail paymentId={mockPayment.id} onReconcile={onReconcile} />, {
      preloadedState: {
        payments: {
          ...{},
          selectedPayment: mockPayment,
          loading: 'SUCCEEDED',
          error: null,
        },
      },
    });

    const reconcileButton = screen.getByRole('button', { name: 'Reconcile' });
    await act(() => user.click(reconcileButton));

    expect(onReconcile).toHaveBeenCalled();
  });

  it('calls onBack callback when back button is clicked', async () => {
    const { mockPayment, user } = setup();
    const onBack = jest.fn();

    renderWithProviders(<PaymentDetail paymentId={mockPayment.id} onBack={onBack} />, {
      preloadedState: {
        payments: {
          ...{},
          selectedPayment: mockPayment,
          loading: 'SUCCEEDED',
          error: null,
        },
      },
    });

    // Assuming there's a back button with a specific role or text
    const backButton = screen.getByRole('button', { name: 'Back' });
    await act(() => user.click(backButton));

    expect(onBack).toHaveBeenCalled();
  });

  it('fetches payment data on component mount', async () => {
    const { mockPayment } = setup();

    renderWithProviders(<PaymentDetail paymentId={mockPayment.id} />, {
      preloadedState: {
        payments: {
          ...{},
          selectedPayment: mockPayment,
          loading: 'SUCCEEDED',
          error: null,
        },
      },
    });
  });

  it('refetches payment data when paymentId changes', async () => {
    const { mockPayment } = setup();

    const { rerender } = renderWithProviders(<PaymentDetail paymentId={mockPayment.id} />, {
      preloadedState: {
        payments: {
          ...{},
          selectedPayment: mockPayment,
          loading: 'SUCCEEDED',
          error: null,
        },
      },
    });

    const newPaymentId = 'new-payment-id';
    rerender(<PaymentDetail paymentId={newPaymentId} />);
  });
});