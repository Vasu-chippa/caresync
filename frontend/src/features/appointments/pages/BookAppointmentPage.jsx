import { useMemo, useState } from 'react';
import { Calendar, Clock, CreditCard, IndianRupee, Star, User, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SlotPicker } from '../components/SlotPicker';
import { useBookAppointment, useDoctorAvailability, useAppointmentsList } from '../hooks';
import { useDoctors } from '../../doctors/hooks';
import { useDoctorRatingStats } from '../../ratings/hooks';
import { RatingModal } from '../../ratings/RatingModal';
import { useMe } from '../../auth/hooks';

export const BookAppointmentPage = () => {
  const navigate = useNavigate();
  const meQuery = useMe();
  const doctorsQuery = useDoctors();
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedSlot, setSelectedSlot] = useState('');
  const [feedback, setFeedback] = useState('');
  const [ratingModalPayload, setRatingModalPayload] = useState(null);
  const [ratedAppointments, setRatedAppointments] = useState(() => new Set());
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }),
    []
  );

  const selectedDoctor = useMemo(() => {
    const doctorKey = String(doctorId || '');
    return (doctorsQuery.data || []).find((doctor) => String(doctor.id || doctor._id) === doctorKey) || null;
  }, [doctorsQuery.data, doctorId]);

  const doctorMap = useMemo(
    () =>
      new Map(
        (doctorsQuery.data || []).map((doctor) => [String(doctor.id || doctor._id), doctor])
      ),
    [doctorsQuery.data]
  );

  const availabilityQuery = useDoctorAvailability({ doctorId, date });
  const selectedDoctorRatingQuery = useDoctorRatingStats(doctorId);
  const bookMutation = useBookAppointment();
  const availableSlotsCount = availabilityQuery.data?.availableSlots?.length ?? 0;
  const availableSlots = availabilityQuery.data?.availableSlots || [];

  const listParams = useMemo(() => ({ page: 1, limit: 8 }), []);
  const appointmentsQuery = useAppointmentsList(listParams);
  const me = meQuery.data;

  const handleRatingSuccess = () => {
    if (!ratingModalPayload?.appointmentId) {
      return;
    }

    setRatedAppointments((prev) => {
      const next = new Set(prev);
      next.add(String(ratingModalPayload.appointmentId));
      return next;
    });
  };

  const onBook = async () => {
    if (!doctorId) {
      setFeedback('Please select a doctor first.');
      return;
    }

    if (!selectedSlot) {
      setFeedback('Please choose a time slot.');
      return;
    }

    setFeedback('');

    try {
      await bookMutation.mutateAsync({
        doctorId,
        date,
        timeSlot: selectedSlot,
      });

      setFeedback('Appointment booked successfully.');
      setSelectedSlot('');
    } catch (error) {
      setFeedback(error.message);
    }
  };

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-(--text-strong)">Appointment Booking</h1>
        <p className="mt-1 text-sm text-(--text-soft)">Select a doctor, choose date, then pick an available slot from 9:00 AM to 6:00 PM.</p>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onBook();
        }}
        className="grid gap-4 rounded-2xl border border-cyan-500/30 bg-[#0e1f3a]/90 p-6 md:grid-cols-2 lg:grid-cols-4"
      >
        <label className="text-sm lg:col-span-2">
          <div className="mb-2 flex items-center gap-2">
            <User className="h-4 w-4 text-cyan-400" />
            <span className="font-medium text-(--text-strong)">Doctor</span>
          </div>
          <select
            value={doctorId}
            onChange={(event) => {
              setDoctorId(event.target.value);
              setSelectedSlot('');
              setFeedback('');
            }}
            className="w-full rounded-lg border border-cyan-500/30 bg-black/20 px-3 py-2 text-(--text-strong) focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            style={{ color: '#e0e0e0', backgroundColor: '#0f1f38' }}
            required
          >
            <option value="" style={{ color: '#888' }}>Select doctor</option>
            {(doctorsQuery.data || []).map((doctor) => (
              <option key={doctor.id || doctor._id} value={doctor.id || doctor._id} style={{ color: '#e0e0e0', backgroundColor: '#0f1f38' }}>
                {doctor.name} - {doctor.specialization} - {currencyFormatter.format(doctor.appointmentFee || 0)}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <div className="mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-400" />
            <span className="font-medium text-(--text-strong)">Date</span>
          </div>
          <input
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setSelectedSlot('');
            }}
            className="w-full rounded-lg border border-purple-500/30 bg-black/20 px-3 py-2 text-(--text-strong) focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            required
          />
        </label>

        <label className="text-sm">
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-lime-400" />
            <span className="font-medium text-(--text-strong)">Time Slot</span>
          </div>
          <select
            value={selectedSlot}
            onChange={(event) => setSelectedSlot(event.target.value)}
            className="w-full rounded-lg border border-lime-500/30 bg-black/20 px-3 py-2 text-(--text-strong) focus:outline-none focus:ring-2 focus:ring-lime-500/50"
            style={{ color: '#e0e0e0', backgroundColor: '#0f1f38' }}
            disabled={!doctorId || availabilityQuery.isLoading || availableSlots.length === 0}
            required
          >
            <option value="" style={{ color: '#888' }}>
              {!doctorId ? 'Select doctor first' : availabilityQuery.isLoading ? 'Loading slots...' : availableSlots.length ? 'Select available time' : 'Doctor not available'}
            </option>
            {availableSlots.map((slot) => (
              <option key={slot} value={slot} style={{ color: '#e0e0e0', backgroundColor: '#0f1f38' }}>
                {slot}
              </option>
            ))}
          </select>
        </label>

        <div className="md:col-span-2 lg:col-span-4 flex items-center justify-between gap-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-100">
          <span>
            {doctorId
              ? availableSlotsCount > 0
                ? `${availableSlotsCount} slots available`
                : 'Doctor not available for selected date'
              : 'Choose doctor to see availability'}
          </span>
          <button
            type="submit"
            disabled={bookMutation.isPending || !doctorId || !selectedSlot}
            className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            <Zap className="h-4 w-4" />
            {bookMutation.isPending ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </form>

      {selectedDoctor ? (
        <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-(--text-strong)">Doctor Details</h2>
          </div>
          <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
            <p><span className="text-(--text-soft)">Name:</span> {selectedDoctor.name}</p>
            <p><span className="text-(--text-soft)">Doctor ID:</span> {selectedDoctor.id || selectedDoctor._id}</p>
            <p><span className="text-(--text-soft)">Specialization:</span> {selectedDoctor.specialization}</p>
            <p><span className="text-(--text-soft)">Experience:</span> {selectedDoctor.experienceYears} years</p>
            <p className="inline-flex items-center gap-1"><span className="text-(--text-soft)">Appointment Fee:</span> <IndianRupee size={14} className="text-cyan-300" />{currencyFormatter.format(selectedDoctor.appointmentFee || 0)}</p>
            <p className="inline-flex items-center gap-1">
              <span className="text-(--text-soft)">Rating:</span>
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
              {selectedDoctorRatingQuery.isLoading
                ? 'Loading...'
                : `${selectedDoctorRatingQuery.data?.averageRating || 0} (${selectedDoctorRatingQuery.data?.totalReviews || 0} reviews)`}
            </p>
            <p className="md:col-span-2"><span className="text-(--text-soft)">Qualification:</span> {selectedDoctor.qualification}</p>
            <p className="md:col-span-2">
              <span className="text-(--text-soft)">Availability ({date}): </span>
              {availabilityQuery.isLoading
                ? 'Loading...'
                : availableSlotsCount > 0
                  ? `${availableSlotsCount} slots available`
                  : 'Doctor not available'}
            </p>
          </div>
        </section>
      ) : null}

      <section className="space-y-3 rounded-2xl border border-(--border) bg-(--surface) p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-lime-400" />
          <h2 className="text-lg font-semibold text-(--text-strong)">Available Slots</h2>
        </div>
        <p className="text-xs text-(--text-soft)">Working hours: 9:00 AM - 6:00 PM</p>
        {availabilityQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="h-10 animate-pulse rounded-lg bg-(--surface-muted)" />
            ))}
          </div>
        ) : availabilityQuery.isError ? (
          <div className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{availabilityQuery.error.message}</div>
        ) : !doctorId ? (
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-3 text-sm text-(--text-soft)">
            Select a doctor to view available slots for the chosen date.
          </div>
        ) : (
          <SlotPicker
            slots={availabilityQuery.data?.availableSlots || []}
            selectedSlot={selectedSlot}
            onSelect={setSelectedSlot}
          />
        )}
      </section>

      {feedback ? (
        <div className="rounded-lg border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--text-soft)">
          {feedback}
        </div>
      ) : null}

      <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-5 w-5 text-pink-400" />
          <h2 className="text-lg font-semibold text-(--text-strong)">Recent Appointments</h2>
        </div>
        {appointmentsQuery.isLoading ? (
          <div className="mt-3 space-y-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-10 animate-pulse rounded-lg bg-(--surface-muted)" />
            ))}
          </div>
        ) : appointmentsQuery.isError ? (
          <p className="mt-3 text-sm text-red-700">{appointmentsQuery.error.message}</p>
        ) : (
          <div className="mt-3 space-y-2">
            {appointmentsQuery.data?.items?.map((item) => {
              const doctor = doctorMap.get(String(item.doctorId));
              return (
              <div
                key={item.appointmentId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-(--border) px-3 py-2 text-sm"
              >
                <span className="font-medium text-(--text-strong)">{item.appointmentId}</span>
                <span>{doctor?.name || 'Doctor'}</span>
                <span className="text-(--text-soft)">{item.doctorId}</span>
                <span>{item.date}</span>
                <span>{item.timeSlot}</span>
                <span className="rounded-full bg-(--surface-muted) px-2 py-0.5">{item.status}</span>
                {me?.role === 'patient' && item.status === 'accepted' ? (
                  <button
                    type="button"
                    onClick={() => navigate('/billing')}
                    className="inline-flex items-center gap-1 rounded-md border border-cyan-400/30 px-2 py-1 text-xs text-cyan-200"
                  >
                    <CreditCard size={12} />
                    Pay
                  </button>
                ) : null}
                {me?.role === 'patient' && item.status === 'completed' ? (
                  <button
                    type="button"
                    disabled={ratedAppointments.has(String(item.appointmentId))}
                    onClick={() => {
                      setRatingModalPayload({
                        appointmentId: item.appointmentId,
                        doctorId: String(item.doctorId),
                      });
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-yellow-400/30 px-2 py-1 text-xs text-yellow-200 disabled:opacity-50"
                  >
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    {ratedAppointments.has(String(item.appointmentId)) ? 'Rated' : 'Rate Doctor'}
                  </button>
                ) : null}
              </div>
              );
            })}
          </div>
        )}
      </section>

      <RatingModal
        isOpen={Boolean(ratingModalPayload)}
        appointmentId={ratingModalPayload?.appointmentId}
        doctorId={ratingModalPayload?.doctorId}
        onClose={() => setRatingModalPayload(null)}
        onSuccess={handleRatingSuccess}
      />
    </section>
  );
};
