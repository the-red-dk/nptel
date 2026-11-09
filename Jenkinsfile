pipeline {
  agent any

  options { timestamps(); disableConcurrentBuilds() }

  environment {
    DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/nptelboard?schema=public'
    IMAGE_NAME = "nptelboard:${env.BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Install') { steps { sh 'npm ci' } }
    stage('Validate') {
      steps {
        sh 'npx prisma generate'
        sh 'npx tsc --noEmit'
        sh 'npm test'
      }
    }
    stage('Build') { steps { sh 'npm run build' } }
    stage('Container') {
      when { branch 'main' }
      steps {
        sh 'docker build -t "$IMAGE_NAME" .'
        archiveArtifacts artifacts: 'Dockerfile,docker-compose.yml,k8s/**,ansible/**', fingerprint: true
      }
    }
  }

  post { always { cleanWs() } }
}
