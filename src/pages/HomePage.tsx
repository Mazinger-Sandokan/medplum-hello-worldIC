import { Loader } from '@mantine/core';
import { formatGivenName } from '@medplum/core';
import { HumanName, Patient, Practitioner } from '@medplum/fhirtypes';
import { Document, ResourceBadge, useMedplum, useMedplumProfile } from '@medplum/react';
import React from 'react';

export function HomePage(): JSX.Element {
  const medplum = useMedplum();
  const profile = useMedplumProfile() as Practitioner;
  const patients: Patient[] = medplum.searchResources('Patient', '_sort=-_lastUpdated').read();

  if (!patients) {
    return <Loader />;
  }
  return (
    <Document>
      <h1>Welcome {formatGivenName(profile.name?.[0] as HumanName)}</h1>
      <h3>Patients</h3>
      {patients.map((e) => (
        <div key={e.id}>
          <ResourceBadge link={true} value={e} />
        </div>
      ))}
    </Document>
  );
}
