# Chunk 05: Class Detail Form And Cancel Surfaces

**Plan Set:** `../plan.md`  
**Spec:** `../spec.md`  
**Status:** Ready For Implementation  
**Depends on:** `02-class-range-state-and-sdk-loading.md`, `03-mobile-class-list-and-card-actions.md`  
**Enables:** `06-mutation-reconciliation-localization-and-verification.md`

## Goal

Add the write and detail surfaces for manager class management: selected class detail, responsive create/edit form, local validation, SDK create/update handoff, and cancellation confirmation. Create/edit should work for one-off classes without loading templates, and cancellation must remain a distinct confirm flow rather than a delete.

## Source Artifacts

- `../spec.md`: Class Form Model, Data Refresh And Local State, Permissions And Access, Styling Requirements.
- `../agenda.md`: Questions 3, 4, and 6.
- `../pseudocode/ClassFormAndLifecycleSurfaces.md`
- `../pseudocode/ClassMutationReconciliationFlow.md`
- `../pseudocode/ManagerClassComponentMap.md`
- `node_modules/@class-kit/react/src/manager/manager-api.ts`

## Relationships

- **Depends on:** Hook range/list state, selected class state, and list selection.
- **Enables:** Final mutation reconciliation and full manager workflow verification.
- **Shared contracts:** `ClassFormFields`, form-to-SDK mapping, `createClass`, `updateClass`, `cancelClass`, selected detail panel.
- **Integration points:** `client.management.classes.create`, `update`, and `cancel`; `useManagedClasses`; `ClassManagementTab`.

## File Responsibility Map

**Create:**
- `src/features/manager/classes/class-detail-panel.tsx` - selected class display, edit trigger, cancel trigger.
- `src/features/manager/classes/class-form-dialog.tsx` - responsive create/edit form and validation.
- `src/features/manager/classes/class-cancel-dialog.tsx` - cancellation confirmation and reason fields.

**Modify:**
- `src/features/manager/classes/use-managed-classes.ts` - add create/update/cancel mutation methods and selection reconciliation hooks.
- `src/features/manager/classes/class-management-tab.tsx` - own create/edit/cancel surface open state and pass submit handlers.
- `src/i18n.ts` - form labels, validation messages, detail labels, cancellation copy.

**Test:**
- No automated form tests. Verify through browser smoke and SDK method inspection.

## Implementation Tasks

### Task 1: Extend Hook With Create, Update, And Cancel

**Files:**
- Modify: `src/features/manager/classes/use-managed-classes.ts`

- [ ] Add mutation methods using explicit SDK commands.

```ts
async function performMutation<T>(status: MutationStatus, command: () => Promise<T>, mutatedClassId?: string) {
  if (!client || mutationStatus !== 'idle') return { ok: false as const }
  setOperationError(null)
  setMutationStatus(status)

  try {
    const result = await command()
    await refreshVisibleRange()
    if (mutatedClassId) setSelectedClassId(mutatedClassId)
    return { ok: true as const, result }
  } catch (error) {
    setOperationError(error instanceof Error ? error.message : 'Class action failed.')
    return { ok: false as const }
  } finally {
    setMutationStatus('idle')
  }
}

const createClass = useCallback(
  (input: CreateManagedClassInput) =>
    performMutation('creating', () => client!.management.classes.create(input)),
  [client, mutationStatus, refreshVisibleRange]
)

const updateClass = useCallback(
  (classId: string, input: Omit<UpdateManagedClassInput, 'classId'>) =>
    performMutation('updating', () => client!.management.classes.update({ ...input, classId }), classId),
  [client, mutationStatus, refreshVisibleRange]
)

const cancelClass = useCallback(
  (classId: string, input: CancelManagedClassInput) =>
    performMutation('cancelling', () => client!.management.classes.cancel(classId, input), classId),
  [client, mutationStatus, refreshVisibleRange]
)
```

If the implementation already has `performMutation` from chunk `03`, extend it rather than duplicating it. Guard null client instead of using `client!` if TypeScript requires it.

### Task 2: Create Detail Panel

**Files:**
- Create: `src/features/manager/classes/class-detail-panel.tsx`

- [ ] Render selected class details and action triggers.

```tsx
import type { ManagedClass } from '@class-kit/react'
import { Edit3, Ban } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/button'

type ClassDetailPanelProps = {
  managedClass: ManagedClass | null
  canManageClasses: boolean
  onEdit: () => void
  onCancel: () => void
}

export function ClassDetailPanel({ managedClass, canManageClasses, onEdit, onCancel }: ClassDetailPanelProps) {
  const { t, i18n } = useTranslation()
  if (!managedClass) return null

  const formatter = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })
  const editable = canManageClasses && !managedClass.read_only

  return (
    <aside className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-soft)]">
      <p className="font-serif text-xs uppercase tracking-[0.25em] text-[var(--color-muted-foreground)]">{t('manager.detail.eyebrow')}</p>
      <h2 className="mt-2 break-words font-serif text-3xl text-[var(--color-foreground)]">{managedClass.name}</h2>
      <dl className="mt-5 grid gap-3 text-sm">
        <DetailRow label={t('manager.detail.time')} value={`${formatter.format(new Date(managedClass.starts_at))} - ${formatter.format(new Date(managedClass.ends_at))}`} />
        <DetailRow label={t('manager.detail.status')} value={t(`manager.classStatus.${managedClass.status}`)} />
        <DetailRow label={t('manager.detail.capacity')} value={`${managedClass.registeredUsersCount ?? 0}/${managedClass.capacity}`} />
        <DetailRow label={t('manager.detail.location')} value={managedClass.location ?? t('manager.detail.noLocation')} />
        {managedClass.notes && <DetailRow label={t('manager.detail.notes')} value={managedClass.notes} />}
        {managedClass.read_only_reason && <DetailRow label={t('manager.detail.readOnly')} value={t(`manager.readOnlyReason.${managedClass.read_only_reason}`)} />}
      </dl>
      {editable && (
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" onClick={onEdit}>
            <Edit3 className="size-4" aria-hidden="true" />
            {t('manager.classActions.edit')}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            <Ban className="size-4" aria-hidden="true" />
            {t('manager.classActions.cancel')}
          </Button>
        </div>
      )}
    </aside>
  )
}
```

Define `DetailRow` in the same file as a small local component.

### Task 3: Create Form Dialog

**Files:**
- Create: `src/features/manager/classes/class-form-dialog.tsx`

- [ ] Implement this responsive form surface. It uses a fixed full-screen mobile overlay and a centered desktop panel. It includes create defaults, edit hydration, local validation, field wiring, SDK mapping, and close-on-success behavior.

```tsx
import type { CreateManagedClassInput, ManagedClass, UpdateManagedClassInput } from '@class-kit/react'
import { X } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/button'

type ClassFormMode = 'create' | 'edit'

type ClassFormDialogProps = {
  open: boolean
  mode: ClassFormMode
  managedClass: ManagedClass | null
  submitting: boolean
  errorMessage: string | null
  onClose: () => void
  onCreate: (input: CreateManagedClassInput) => Promise<{ ok: boolean }>
  onUpdate: (classId: string, input: Omit<UpdateManagedClassInput, 'classId'>) => Promise<{ ok: boolean }>
}

type ClassFormFields = {
  name: string
  description: string
  category: string
  startsLocal: string
  endsLocal: string
  capacity: string
  location: string
  status: 'draft' | 'published'
  visibility: 'public' | 'hidden' | 'members_only'
  registrationPolicy: 'auto_approve' | 'member_auto_approve' | 'approval_required'
  membershipRequirement: 'none' | 'required'
  notes: string
}

const createDefaults: ClassFormFields = {
  name: '',
  description: '',
  category: '',
  startsLocal: '',
  endsLocal: '',
  capacity: '12',
  location: '',
  status: 'draft',
  visibility: 'public',
  registrationPolicy: 'auto_approve',
  membershipRequirement: 'none',
  notes: '',
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toLocalDateTimeInput(value: string) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function fieldsFromClass(managedClass: ManagedClass | null): ClassFormFields {
  if (!managedClass) return createDefaults
  return {
    name: managedClass.name,
    description: managedClass.description ?? '',
    category: managedClass.category ?? '',
    startsLocal: toLocalDateTimeInput(managedClass.starts_at),
    endsLocal: toLocalDateTimeInput(managedClass.ends_at),
    capacity: String(managedClass.capacity),
    location: managedClass.location ?? '',
    status: managedClass.status,
    visibility: managedClass.visibility,
    registrationPolicy: managedClass.registration_policy,
    membershipRequirement: managedClass.membership_requirement,
    notes: managedClass.notes ?? '',
  }
}

function toClassInput(fields: ClassFormFields): CreateManagedClassInput {
  return {
    templateId: null,
    name: fields.name.trim(),
    description: emptyToNull(fields.description),
    category: emptyToNull(fields.category),
    startsAt: new Date(fields.startsLocal).toISOString(),
    endsAt: new Date(fields.endsLocal).toISOString(),
    capacity: Number(fields.capacity),
    location: emptyToNull(fields.location),
    status: fields.status,
    visibility: fields.visibility,
    registrationPolicy: fields.registrationPolicy,
    membershipRequirement: fields.membershipRequirement,
    notes: emptyToNull(fields.notes),
  }
}

function validateClassForm(fields: ClassFormFields, t: (key: string) => string) {
  const errors: string[] = []
  const startsAt = new Date(fields.startsLocal)
  const endsAt = new Date(fields.endsLocal)
  const capacity = Number(fields.capacity)

  if (!fields.name.trim()) errors.push(t('manager.validation.nameRequired'))
  if (!fields.startsLocal || !fields.endsLocal || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    errors.push(t('manager.validation.invalidDates'))
  } else if (endsAt.getTime() <= startsAt.getTime()) {
    errors.push(t('manager.validation.endAfterStart'))
  }
  if (!Number.isInteger(capacity) || capacity <= 0) errors.push(t('manager.validation.capacity'))

  return errors
}

type TextFieldProps = {
  label: string
  value: string
  type?: string
  onChange: (value: string) => void
}

function TextField({ label, value, type = 'text', onChange }: TextFieldProps) {
  return (
    <label className="block text-sm text-muted-foreground">
      <span>{label}</span>
      <input
        className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background/42 px-3 text-foreground outline-none focus:border-blush-strong"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

type SelectFieldProps = {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="block text-sm text-muted-foreground">
      <span>{label}</span>
      <select
        className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background/42 px-3 text-foreground outline-none focus:border-blush-strong"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function ClassFormDialog({
  open,
  mode,
  managedClass,
  submitting,
  errorMessage,
  onClose,
  onCreate,
  onUpdate,
}: ClassFormDialogProps) {
  const { t } = useTranslation()
  const [fields, setFields] = useState<ClassFormFields>(createDefaults)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    setFields(mode === 'edit' ? fieldsFromClass(managedClass) : createDefaults)
    setValidationErrors([])
  }, [managedClass, mode, open])

  if (!open) return null

  const updateField = <K extends keyof ClassFormFields>(key: K, value: ClassFormFields[K]) => {
    setFields((current) => ({ ...current, [key]: value }))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errors = validateClassForm(fields, t)
    setValidationErrors(errors)
    if (errors.length > 0) return

    const input = toClassInput(fields)
    const result =
      mode === 'edit' && managedClass
        ? await onUpdate(managedClass.id, input)
        : await onCreate(input)

    if (result.ok) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-0 sm:grid sm:place-items-center sm:p-6">
      <section className="flex h-full w-full flex-col overflow-hidden bg-background text-foreground sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-[1.4rem] sm:border sm:border-border sm:bg-card/95">
        <header className="flex items-center justify-between gap-3 border-b border-border p-5">
          <div className="min-w-0">
            <p className="font-serif text-xs uppercase tracking-[0.25em] text-muted-foreground">
              {t('manager.tabs.classes')}
            </p>
            <h2 className="mt-1 font-serif text-3xl">
              {mode === 'edit' ? t('manager.form.editTitle') : t('manager.form.createTitle')}
            </h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label={t('actions.close')}>
            <X className="size-5" aria-hidden="true" />
          </Button>
        </header>

        <form className="flex-1 overflow-y-auto p-5" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField label={t('manager.form.name')} value={fields.name} onChange={(value) => updateField('name', value)} />
            </div>
            <TextField label={t('manager.form.startsAt')} type="datetime-local" value={fields.startsLocal} onChange={(value) => updateField('startsLocal', value)} />
            <TextField label={t('manager.form.endsAt')} type="datetime-local" value={fields.endsLocal} onChange={(value) => updateField('endsLocal', value)} />
            <TextField label={t('manager.form.capacity')} type="number" value={fields.capacity} onChange={(value) => updateField('capacity', value)} />
            <TextField label={t('manager.form.location')} value={fields.location} onChange={(value) => updateField('location', value)} />
            <TextField label={t('manager.form.category')} value={fields.category} onChange={(value) => updateField('category', value)} />
            <SelectField
              label={t('manager.form.status')}
              value={fields.status}
              onChange={(value) => updateField('status', value as ClassFormFields['status'])}
              options={[
                { value: 'draft', label: t('manager.classStatus.draft') },
                { value: 'published', label: t('manager.classStatus.published') },
              ]}
            />
            <SelectField
              label={t('manager.form.visibility')}
              value={fields.visibility}
              onChange={(value) => updateField('visibility', value as ClassFormFields['visibility'])}
              options={[
                { value: 'public', label: t('manager.visibility.public') },
                { value: 'hidden', label: t('manager.visibility.hidden') },
                { value: 'members_only', label: t('manager.visibility.membersOnly') },
              ]}
            />
            <SelectField
              label={t('manager.form.registrationPolicy')}
              value={fields.registrationPolicy}
              onChange={(value) => updateField('registrationPolicy', value as ClassFormFields['registrationPolicy'])}
              options={[
                { value: 'auto_approve', label: t('manager.registrationPolicy.autoApprove') },
                { value: 'member_auto_approve', label: t('manager.registrationPolicy.memberAutoApprove') },
                { value: 'approval_required', label: t('manager.registrationPolicy.approvalRequired') },
              ]}
            />
            <SelectField
              label={t('manager.form.membershipRequirement')}
              value={fields.membershipRequirement}
              onChange={(value) => updateField('membershipRequirement', value as ClassFormFields['membershipRequirement'])}
              options={[
                { value: 'none', label: t('manager.membershipRequirement.none') },
                { value: 'required', label: t('manager.membershipRequirement.required') },
              ]}
            />
            <label className="block text-sm text-muted-foreground sm:col-span-2">
              <span>{t('manager.form.description')}</span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-xl border border-border bg-background/42 p-3 text-foreground outline-none focus:border-blush-strong"
                value={fields.description}
                onChange={(event) => updateField('description', event.target.value)}
              />
            </label>
          </div>

          <details className="mt-5 rounded-xl border border-border bg-background/42 p-4">
            <summary className="cursor-pointer font-serif text-lg text-foreground">{t('manager.form.advanced')}</summary>
            <label className="mt-4 block text-sm text-muted-foreground">
              <span>{t('manager.form.notes')}</span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-xl border border-border bg-background/42 p-3 text-foreground outline-none focus:border-blush-strong"
                value={fields.notes}
                onChange={(event) => updateField('notes', event.target.value)}
              />
            </label>
          </details>

          {(validationErrors.length > 0 || errorMessage) && (
            <div className="mt-5 rounded-xl border border-border bg-background/42 p-4 text-sm text-blush-strong">
              {validationErrors.map((error) => <p key={error}>{error}</p>)}
              {errorMessage && <p>{errorMessage}</p>}
            </div>
          )}

          <footer className="sticky bottom-0 -mx-5 mt-6 flex gap-2 border-t border-border bg-background/95 p-5 sm:static sm:mx-0 sm:bg-transparent sm:p-0">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('actions.close')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {mode === 'edit' ? t('manager.classActions.save') : t('manager.classActions.create')}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  )
}
```

- [ ] Add the extra translation keys used above: `manager.visibility.*`, `manager.registrationPolicy.*`, and `manager.membershipRequirement.*` in English, Hebrew, and Russian.

### Task 4: Create Cancel Dialog

**Files:**
- Create: `src/features/manager/classes/class-cancel-dialog.tsx`

- [ ] Add a confirmation surface with optional reason and expose toggle.

```tsx
import type { CancelManagedClassInput, ManagedClass } from '@class-kit/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/button'

type ClassCancelDialogProps = {
  open: boolean
  managedClass: ManagedClass | null
  submitting: boolean
  errorMessage: string | null
  onClose: () => void
  onConfirm: (classId: string, input: CancelManagedClassInput) => Promise<{ ok: boolean }>
}

export function ClassCancelDialog({ open, managedClass, submitting, errorMessage, onClose, onConfirm }: ClassCancelDialogProps) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const [exposeReasonToUsers, setExposeReasonToUsers] = useState(false)

  if (!open || !managedClass) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-0 sm:place-items-center sm:p-6">
      <section className="w-full rounded-t-[1.4rem] border border-[var(--color-border)] bg-[var(--color-background)] p-5 sm:max-w-lg sm:rounded-[1.4rem]">
        <h2 className="font-serif text-3xl">{t('manager.cancel.title')}</h2>
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{t('manager.cancel.body')}</p>
        <label className="mt-5 block text-sm">
          <span>{t('manager.cancel.reason')}</span>
          <textarea className="mt-2 min-h-24 w-full rounded-[1.4rem] border border-[var(--color-border)] bg-transparent p-3" value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
        <label className="mt-4 flex items-start gap-3 text-sm">
          <input type="checkbox" checked={exposeReasonToUsers} onChange={(event) => setExposeReasonToUsers(event.target.checked)} />
          <span>{t('manager.cancel.exposeReason')}</span>
        </label>
        {errorMessage && <p className="mt-4 text-sm text-blush-strong">{errorMessage}</p>}
        <div className="mt-6 flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>{t('actions.close')}</Button>
          <Button type="button" disabled={submitting} onClick={() => onConfirm(managedClass.id, { reason: emptyToNull(reason), exposeReasonToUsers })}>
            {t('manager.classActions.cancel')}
          </Button>
        </div>
      </section>
    </div>
  )
}
```

Define `emptyToNull` locally or import the form helper if it is exported.

### Task 5: Wire Surfaces Into Class Management Tab

**Files:**
- Modify: `src/features/manager/classes/class-management-tab.tsx`

- [ ] Add local surface state:

```ts
type FormSurface = { mode: 'create'; classId?: never } | { mode: 'edit'; classId: string } | null
const [formSurface, setFormSurface] = useState<FormSurface>(null)
const [cancelOpen, setCancelOpen] = useState(false)
```

- [ ] Add create button only when `canManageClasses` is true.
- [ ] Render `ClassDetailPanel`, `ClassFormDialog`, and `ClassCancelDialog`.
- [ ] Close create/edit form after successful mutation and refreshed range; keep the selected class visible when possible.

## Verification

- Run: `rtk rg -n "management\\.classes\\.(create|update|cancel)|management\\.templates|management\\.schedules|supabase|functions\\.invoke|rpc\\(" src/features/manager/classes`
  - Expected: create/update/cancel calls exist only in `use-managed-classes.ts`; no template/schedule/raw Supabase calls.
- Run: `rtk rg -n "delete|remove" src/features/manager/classes`
  - Expected: no user-facing hard-delete control for classes.
- Browser smoke:
  - Create form opens as full-screen or drawer-like surface on mobile.
  - Create form defaults status to draft.
  - Invalid name, dates, and capacity show validation before SDK submit.
  - Edit form maps selected class values.
  - Cancel opens only from detail and explains cancellation is not deletion.

## Acceptance Criteria Covered

- Create one-off class without templates.
- Edit editable class fields.
- Cancel class with optional reason and user-visible reason toggle.
- Detail panel displays manager-relevant class state.
- No hard delete appears.
- No template selector or template SDK loading.

## Risks And Rollback

- Risk: form size on mobile. Keep advanced/notes fields visually secondary and use full-screen surface.
- Risk: local date-time input conversion. Convert `datetime-local` values through `new Date(value).toISOString()` and verify with real local inputs.
- Rollback: remove form/detail/cancel components, remove create/update/cancel actions from hook, and keep list/card read workflow intact.

## Non-Goals

- No registration roster management.
- No attendance management.
- No template-backed class creation selector.
- No schedule-generated class editing beyond backend-allowed fields.

## Type And Name Consistency

- Export `ClassDetailPanel`, `ClassFormDialog`, and `ClassCancelDialog`.
- Hook exposes `createClass`, `updateClass`, and `cancelClass`.
- Form field names map to SDK inputs `startsAt`, `endsAt`, `capacity`, `visibility`, `registrationPolicy`, `membershipRequirement`, and `notes`.
