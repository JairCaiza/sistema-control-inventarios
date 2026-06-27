pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        BACKEND_IMAGE = 'sistemacontrolinventarios-backend-ci'
        FRONTEND_IMAGE = 'sistemacontrolinventarios-frontend-ci'
        FRONTEND_API_URL = 'http://localhost:3001/api'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Verificar entorno') {
            steps {
                sh '''
                    echo "=== Información del entorno CI ==="
                    git --version
                    docker --version
                    pwd
                    ls -la
                    ls -la back
                    ls -la frontend
                '''
            }
        }

        stage('Pruebas Backend') {
            steps {
                sh '''
                    echo "=== Ejecutando pruebas automatizadas del backend ==="
                    docker build -t backend-test-runner ./back
                    docker run --rm backend-test-runner npm test
                '''
            }
        }

        stage('Construir imagen Backend') {
            steps {
                sh '''
                    echo "=== Construyendo imagen Docker del backend ==="
                    docker build --no-cache -t $BACKEND_IMAGE:latest ./back
                '''
            }
        }

        stage('Construir imagen Frontend') {
            steps {
                sh '''
                    echo "=== Construyendo imagen Docker del frontend ==="
                    docker build --no-cache \
                      --build-arg VITE_API_URL=$FRONTEND_API_URL \
                      -t $FRONTEND_IMAGE:latest ./frontend
                '''
            }
        }

        stage('Verificar imágenes') {
            steps {
                sh '''
                    echo "=== Imágenes generadas por el pipeline CI ==="
                    docker images | grep sistemacontrolinventarios
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline CI ejecutado correctamente: construcción, pruebas y validación completadas.'
        }

        failure {
            echo 'Pipeline CI falló. Revisar la consola de Jenkins.'
        }

        always {
            echo 'Finalizó la ejecución del pipeline de Integración Continua.'
        }
    }
}