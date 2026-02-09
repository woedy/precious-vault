import React, { useState } from 'react';
import { useDeliveryManagement } from '@/hooks/useDeliveryManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StatusBadge from '@/components/StatusBadge';
import { 
  X, 
  Package, 
  User, 
  Calendar, 
  MapPin,
  Truck,
  Hash,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  deliveryStatusUpdateSchema, 
  carrierAssignmentSchema,
  type DeliveryStatusUpdateFormData,
  type CarrierAssignmentFormData
} from '@/lib/validationSchemas';

interface DeliveryDetailModalProps {
  deliveryId: string;
  onClose: () => void;
}

const DeliveryDetailModal: React.FC<DeliveryDetailModalProps> = ({ 
  deliveryId, 
  onClose 
}) => {
  const { 
    useDeliveryDetails, 
    useDeliveryHistory,
    updateStatus, 
    assignCarrier 
  } = useDeliveryManagement();
  
  const deliveryDetails = useDeliveryDetails(deliveryId);
  const deliveryHistory = useDeliveryHistory(deliveryId);
  
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [showCarrierForm, setShowCarrierForm] = useState(false);

  const {
    register: registerStatus,
    handleSubmit: handleSubmitStatus,
    formState: { errors: statusErrors },
    reset: resetStatus,
  } = useForm<DeliveryStatusUpdateFormData>({
    resolver: zodResolver(deliveryStatusUpdateSchema),
  });

  const {
    register: registerCarrier,
    handleSubmit: handleSubmitCarrier,
    formState: { errors: carrierErrors },
    reset: resetCarrier,
  } = useForm<CarrierAssignmentFormData>({
    resolver: zodResolver(carrierAssignmentSchema),
  });

  const handleStatusUpdate = async (data: DeliveryStatusUpdateFormData) => {
    if (!window.confirm('Are you sure you want to update the delivery status?')) {
      return;
    }

    try {
      await updateStatus.mutateAsync({
        deliveryId,
        status: data.status,
        description: data.description,
      });
      resetStatus();
      setShowStatusForm(false);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleCarrierAssignment = async (data: CarrierAssignmentFormData) => {
    if (!window.confirm('Are you sure you want to assign this carrier?')) {
      return;
    }

    try {
      await assignCarrier.mutateAsync({
        deliveryId,
        carrier: data.carrier,
        tracking_number: data.tracking_number,
      });
      resetCarrier();
      setShowCarrierForm(false);
    } catch (error) {
      console.error('Failed to assign carrier:', error);
      alert('Failed to assign carrier. Please try again.');
    }
  };

  if (deliveryDetails.isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!deliveryDetails.data) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Failed to load delivery details</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  const delivery = deliveryDetails.data;
  const history = deliveryHistory.data ?? [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Delivery Details</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Delivery ID: #{delivery.id}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Delivery Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Delivery Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">User</p>
                  <p className="text-sm text-muted-foreground">{delivery.user_email}</p>
                  {delivery.user_name && (
                    <p className="text-sm text-muted-foreground">{delivery.user_name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <StatusBadge status={delivery.status} />
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Truck className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Carrier</p>
                  <p className="text-sm text-muted-foreground">
                    {delivery.carrier || 'Not assigned'}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Tracking Number</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {delivery.tracking_number || 'Not assigned'}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(delivery.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(delivery.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {delivery.estimated_delivery && (
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Estimated Delivery</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(delivery.estimated_delivery).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Shipping Address</h3>
            <div className="flex items-start space-x-3 border rounded-lg p-4">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm">{delivery.shipping_address.street}</p>
                <p className="text-sm">
                  {delivery.shipping_address.city}, {delivery.shipping_address.state}{' '}
                  {delivery.shipping_address.postal_code}
                </p>
                <p className="text-sm">{delivery.shipping_address.country}</p>
              </div>
            </div>
          </div>

          {/* Delivery Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Items</h3>
            <div className="space-y-3">
              {delivery.items.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <Package className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.metal_name} ({item.metal_symbol})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {parseFloat(item.weight_oz).toFixed(4)} oz × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Delivery History */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Delivery History</h3>
            {history.length > 0 ? (
              <div className="space-y-3">
                {history.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start space-x-4 border-l-2 border-primary pl-4 pb-4 last:pb-0"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-3 w-3 rounded-full bg-primary"></div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={event.status} />
                        <span className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{event.description}</p>
                      {event.location && (
                        <p className="text-sm text-muted-foreground flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                No history events yet
              </div>
            )}
          </div>

          {/* Action Forms */}
          <div className="space-y-4 pt-4 border-t">
            {/* Carrier Assignment Form */}
            {!showCarrierForm ? (
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Carrier Assignment</h3>
                <Button
                  variant="outline"
                  onClick={() => setShowCarrierForm(true)}
                  disabled={updateStatus.isPending || assignCarrier.isPending}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  {delivery.carrier ? 'Update Carrier' : 'Assign Carrier'}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmitCarrier(handleCarrierAssignment)} className="space-y-4 border rounded-lg p-4 bg-muted/50">
                <h3 className="text-lg font-semibold">Carrier Assignment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="carrier">Carrier *</Label>
                    <select
                      id="carrier"
                      {...registerCarrier('carrier')}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                      defaultValue={delivery.carrier || ''}
                    >
                      <option value="">Select carrier</option>
                      <option value="FedEx">FedEx</option>
                      <option value="UPS">UPS</option>
                      <option value="DHL">DHL</option>
                      <option value="USPS">USPS</option>
                    </select>
                    {carrierErrors.carrier && (
                      <p className="text-sm text-red-600 mt-1">
                        {carrierErrors.carrier.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="tracking_number">Tracking Number *</Label>
                    <Input
                      id="tracking_number"
                      {...registerCarrier('tracking_number')}
                      placeholder="Enter tracking number"
                      className="mt-1"
                      defaultValue={delivery.tracking_number || ''}
                    />
                    {carrierErrors.tracking_number && (
                      <p className="text-sm text-red-600 mt-1">
                        {carrierErrors.tracking_number.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCarrierForm(false);
                      resetCarrier();
                    }}
                    disabled={assignCarrier.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={assignCarrier.isPending}
                  >
                    {assignCarrier.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Assigning...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Assign Carrier
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* Status Update Form */}
            {!showStatusForm ? (
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Status Update</h3>
                <Button
                  variant="outline"
                  onClick={() => setShowStatusForm(true)}
                  disabled={updateStatus.isPending || assignCarrier.isPending}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmitStatus(handleStatusUpdate)} className="space-y-4 border rounded-lg p-4 bg-muted/50">
                <h3 className="text-lg font-semibold">Status Update</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">New Status *</Label>
                    <select
                      id="status"
                      {...registerStatus('status')}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                      defaultValue={delivery.status}
                    >
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="customs">Customs</option>
                      <option value="delivered">Delivered</option>
                    </select>
                    {statusErrors.status && (
                      <p className="text-sm text-red-600 mt-1">
                        {statusErrors.status.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      {...registerStatus('description')}
                      placeholder="Add a note about this status change"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowStatusForm(false);
                      resetStatus();
                    }}
                    disabled={updateStatus.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateStatus.isPending}
                  >
                    {updateStatus.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Update Status
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetailModal;
