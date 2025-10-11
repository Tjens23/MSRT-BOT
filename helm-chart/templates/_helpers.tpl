{{/*
Expand the name of the chart.
*/}}
{{- define "msrt-bot.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "msrt-bot.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "msrt-bot.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "msrt-bot.labels" -}}
helm.sh/chart: {{ include "msrt-bot.chart" . }}
{{ include "msrt-bot.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "msrt-bot.selectorLabels" -}}
app.kubernetes.io/name: {{ include "msrt-bot.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Database labels
*/}}
{{- define "msrt-bot.database.labels" -}}
helm.sh/chart: {{ include "msrt-bot.chart" . }}
{{ include "msrt-bot.database.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Database selector labels
*/}}
{{- define "msrt-bot.database.selectorLabels" -}}
app.kubernetes.io/name: {{ include "msrt-bot.name" . }}-postgres
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: database
{{- end }}

{{/*
Database service name
*/}}
{{- define "msrt-bot.database.serviceName" -}}
{{- printf "%s-postgres" (include "msrt-bot.fullname" .) }}
{{- end }}

{{/*
Database connection string
*/}}
{{- define "msrt-bot.database.host" -}}
{{- if .Values.database.enabled }}
{{- include "msrt-bot.database.serviceName" . }}
{{- else }}
{{- .Values.database.external.host }}
{{- end }}
{{- end }}

{{/*
Database port
*/}}
{{- define "msrt-bot.database.port" -}}
{{- if .Values.database.enabled }}
{{- "5432" }}
{{- else }}
{{- .Values.database.external.port | toString }}
{{- end }}
{{- end }}

{{/*
Database name
*/}}
{{- define "msrt-bot.database.name" -}}
{{- if .Values.database.enabled }}
{{- .Values.database.postgres.auth.database }}
{{- else }}
{{- .Values.database.external.database }}
{{- end }}
{{- end }}

{{/*
Database username
*/}}
{{- define "msrt-bot.database.username" -}}
{{- if .Values.database.enabled }}
{{- .Values.database.postgres.auth.username }}
{{- else }}
{{- .Values.database.external.username }}
{{- end }}
{{- end }}