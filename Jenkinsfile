pipeline {
  agent any

  options { timestamps(); disableConcurrentBuilds() }
  triggers { pollSCM('H/5 * * * *') }

  environment {
    DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/nptelboard?schema=public'
    IMAGE_NAME = "nptelboard:${env.BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Install') {
      steps {
        script { if (isUnix()) sh 'npm ci' else bat 'npm ci' }
      }
    }
    stage('Validate') {
      steps {
        script {
          if (isUnix()) {
            sh 'npx prisma generate'
            sh 'npx tsc --noEmit'
            sh 'npm test'
          } else {
            bat 'npx prisma generate'
            bat 'npx tsc --noEmit'
            bat 'npm test'
          }
        }
      }
    }
    stage('Build') {
      steps {
        script { if (isUnix()) sh 'npm run build' else bat 'npm run build' }
      }
    }
    stage('Container') {
      steps {
        script {
          if (isUnix()) sh 'docker build -t "$IMAGE_NAME" .'
          else bat "docker build -t ${env.IMAGE_NAME} ."
        }
        archiveArtifacts artifacts: 'Dockerfile,docker-compose.yml,k8s/**,ansible/**', fingerprint: true
      }
    }
  }

  post { always { cleanWs() } }
}
