import { Loader, Tabs } from '@mantine/core';
import { DiagnosticReport, Patient, ServiceRequest } from '@medplum/fhirtypes';
import {
  AddressDisplay,
  ContactPointDisplay,
  Document,
  PatientTimeline,
  ResourceAvatar,
  ResourceHistoryTable,
  ResourceName,
  useMedplum,
} from '@medplum/react';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import './PatientPage.css';

interface PatientGraphQLResponse {
  data: {
    patient: Patient;
    orders: ServiceRequest[];
    reports: DiagnosticReport[];
  };
}

export function PatientPage(): JSX.Element {
  const medplum = useMedplum();
  const { id } = useParams();
  const [response, setResponse] = useState<PatientGraphQLResponse>();

  /**
   * Use the [FHIR graphQL schema](http://hl7.org/fhir/R4B/graphql.html) to query
   * multiple resources related to this patient
   */
  useEffect(() => {
    const query = `{
      patient: Patient(id: "${id}") {
        resourceType,
        id,
        meta { lastUpdated },
        birthDate,
        name {
          given,
          family
        },
        telecom {
          system,
          value
        },
        address {
          line,
          city,
          state
        }
      },
      orders: ServiceRequestList(subject: "Patient/${id}") {
        resourceType,
        id,
        meta { lastUpdated },
        category {
          text
        },
        code {
          text
        }
      },
      reports: DiagnosticReportList(subject: "Patient/${id}") {
        resourceType,
        id,
        meta { lastUpdated },
        code {
          text
        }
      }
    }`;
    medplum.graphql(query).then(setResponse);
  }, [medplum, id]);
  const [tab, setTab] = useState<string | null>('overview');

  if (!response) {
    return <Loader />;
  }

  const { patient, orders, reports } = response.data;

  return (
    /**
     * Use the Mantine Tabs components to implement a simple tabbed layout
     */
    <Tabs value={tab} onTabChange={setTab}>
      <Tabs.List>
        <Tabs.Tab value="overview">Overview</Tabs.Tab>
        <Tabs.Tab value="timeline">Timeline</Tabs.Tab>
        <Tabs.Tab value="history">History</Tabs.Tab>
      </Tabs.List>
      <Document>
        <Tabs.Panel value="overview">
          {/**
           * You can combine Medplum components with plain HTML to quickly display patient data.
           * Medplum has out of the box components to render common data types such as
           *   - Addresses
           *   - Phone numbers
           *   - Patient/Provider names
           *   - Patient/Provider profile photo
           * */}
          <div className="patient-sidebar">
            <div className="patient-title">
              <ResourceAvatar value={patient} />
              <ResourceName value={patient} />
            </div>
            <h3>Birth Date</h3>
            <div>{patient.birthDate}</div>
            <h3>Address</h3>
            {patient.address?.map((a, i) => (
              <div key={`address-${i}`}>
                <AddressDisplay value={a} />
              </div>
            ))}
            <h3>Contact</h3>
            {patient.telecom?.map((t, i) => (
              <div key={`contact-${i}`}>
                <ContactPointDisplay value={t} />
              </div>
            ))}
          </div>
          <div className="patient-demographics">
            <h3>Demographics</h3>
            <div>Created Date: {patient.meta?.lastUpdated}</div>
            <table>
              <tbody>
                <tr>
                  <td>Prefix: {patient?.name?.[0]?.prefix}</td>
                  <td>First: {patient?.name?.[0]?.given?.[0]}</td>
                  <td>Middle: {patient?.name?.[0]?.given?.[1]}</td>
                  <td>Last: {patient?.name?.[0]?.family}</td>
                  <td>Suffix: {patient?.name?.[0]?.suffix}</td>
                </tr>
              </tbody>
            </table>
            <h3>Orders ({orders?.length})</h3>
            <ul>
              {orders?.map((o, i) => (
                <li key={`order-${i}`}>
                  <a href={`/ServiceRequest/${o.id}`}>{o.code?.text}</a> ({formatDate(o.meta?.lastUpdated)})
                </li>
              ))}
            </ul>
            <h3>Reports ({reports?.length})</h3>
            <ul>
              {reports?.map((o, i) => (
                <li key={`report-${i}`}>
                  <a href={`/DiagnosticReport/${o.id}`}>
                    {o.code?.text} ({formatDate(o.meta?.lastUpdated)})
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Tabs.Panel>
        {/**
         * The PatientTimeline component displays relevant events related to the patient
         */}
        <Tabs.Panel value="timeline">
          <PatientTimeline patient={patient} />
        </Tabs.Panel>
        {/**
         * The ResourceHistoryTable allows you to audit all the changes that have been made to the Patient resource
         */}
        <Tabs.Panel value="history">
          <ResourceHistoryTable resourceType="Patient" id={patient.id} />
        </Tabs.Panel>
      </Document>
    </Tabs>
  );
}

function formatDate(date: string | undefined): string {
  if (!date) {
    return '';
  }
  const d = new Date(date);
  return d.toLocaleDateString();
}
