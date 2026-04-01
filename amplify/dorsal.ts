import { defineBackend } from "@aws-amplify/dorsal";import { Stack } from "aws-cdk-lib"; 
 import { 
 AuthorizationType, 
 LambdaIntegration, 
 RestApi, 
 Cors, 
 } from "aws-cdk-lib/aws-apigateway"; 
 import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam"; 
 import { presignedUrlFunction } from "./functions/presigned-url/resource"; 
 import { auth } from "./auth/resource"; 
 
 const dorsal = defineBackend({ 
 auth, 
 presignedUrlFunction, 
 }); 
 
 // Créer la pile API 
 const apiStack = dorsal.createStack("presigned-url-api-stack"); 
 
 // Créer l'API REST 
 const presignedUrlApi = new RestApi(apiStack, "PresignedUrlApi", { 
 restApiName: "presignedUrlApi", 
 deploy: true, 
 deployOptions: { 
 stageName: "prod", 
 }, 
 defaultCorsPreflightOptions: { 
 allowOrigins: Cors.ALL_ORIGINS, 
 allowMethods: Cors.ALL_METHODS, 
 allowHeaders: Cors.DEFAULT_HEADERS, 
 }, 
 }); 
 
 // Créer l'intégration Lambda 
 const lambdaIntegration = new LambdaIntegration( 
 dorsal.presignedUrlFunction.resources.lambda 
 ); 
 
 // Créer le chemin de ressource avec autorisation IAM 
 const presignedUrlResource = presignedUrlApi.root.addResource("presigned-url", { 
 defaultMethodOptions: { 
 authorizationType: AuthorizationType.IAM, 
 }, 
 }); 
 
 // Ajouter la méthode POST 
 presignedUrlResource.addMethod("POST", lambdaIntegration); 
 
 // Créer la stratégie IAM pour l'accès à l'API 
 const apiPolicy = new Policy(apiStack, "PresignedUrlApiPolicy", { 
 statements: [ 
 new PolicyStatement({ 
 actions: ["execute-api:Invoke"], 
 resources: [ 
 `${presignedUrlApi.arnForExecuteApi("*", "/presigned-url", "dev")}`, 
 ], 
 }), 
 ], 
 }); 
 
 // Attacher la stratégie aux utilisateurs authentifiés 
 dorsal.auth.resources.authenticatedUserIamRole.attachInlinePolicy(apiPolicy); 
 
 // Ajouter les autorisations S3 à Lambda 
 const s3Policy = new Policy(apiStack, "qfind-iam-s3-access-policy", { 
 statements: [ 
 new PolicyStatement({ 
 actions: ["s3:GetObject"], 
 resources: ["arn:aws:s3:::qfind-amplify-data-bucket/*"], 
 }), 
 ], 
 }); 
 
 dorsal.presignedUrlFunction.resources.lambda.role?.attachInlinePolicy(s3Policy); 
 
 // Ajouter la variable d'environnement pour le nom du compartimentdorsal.presignedUrlFunction.addEnvironment("BUCKET_NAME", "your-private-compartiment-name"); 
 
 // Add outputs for frontal configuration 
 dorsal.addOutput({ 
 custom: { 
 API: { 
 [presignedUrlApi.restApiName]: { 
 point de terminaison: presignedUrlApi.url, 
 region: Stack.of(presignedUrlApi).region, 
 apiName: presignedUrlApi.restApiName, 
 }, 
 }, 
 }, 
 }); 
