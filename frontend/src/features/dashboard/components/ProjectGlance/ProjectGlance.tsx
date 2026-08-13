import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

import styles from "./ProjectGlance.module.css";

const datasetFacts = [
  { label: "Dataset", value: "NHANES 2017–2020" },
  { label: "Participants", value: "15,560" },
  { label: "Initial Variables", value: "647" },
  { label: "Final Selected Features", value: "44" },
  { label: "Target", value: "Composite CVD" },
  {
    label: "Data Sources",
    value:
      "NHANES demographic, examination, laboratory, questionnaire, dietary and supplement data.",
  },
];

const preprocessingSteps = [
  "Data validation",
  "Data cleaning",
  "Missing-value handling",
  "Duplicate removal",
  "Variable grouping",
  "Categorical encoding",
  "Feature quality assessment",
  "Variance filtering",
  "Correlation analysis",
  "Missing-indicator removal",
  "Train-test splitting",
  "Class imbalance handling",
];

const selectionMethods = [
  {
    name: "Random Forest Feature Importance",
    description:
      "Ranks features by how much they reduce impurity across 500 decision trees, capturing non-linear relationships with the target.",
  },
  {
    name: "Mutual Information",
    description:
      "Measures the statistical dependence between each feature and the target, picking up both linear and non-linear associations.",
  },
  {
    name: "LASSO",
    description:
      "Uses L1-regularized logistic regression (5-fold cross-validated) to shrink irrelevant coefficients to zero.",
  },
];

const models = [
  {
    name: "Logistic Regression",
    description:
      "An interpretable parametric baseline that models the log-odds of CVD as a linear combination of the features — establishing the reference performance.",
  },
  {
    name: "Random Forest",
    description:
      "An ensemble of 500 decision trees (max depth 20) that captures non-linear gene–diet–environment interactions by averaging many weak learners.",
  },
  {
    name: "XGBoost",
    description:
      "A gradient-boosted ensemble that sequentially corrects the errors of previous trees, tuned with regularization for robust, high-accuracy prediction.",
  },
  {
    name: "Support Vector Machine",
    description:
      "An RBF-kernel classifier that projects participants into a higher-dimensional space to separate CVD cases from controls for comparison.",
  },
];

interface ModelRow {
  model: string;
  accuracy: string;
  precision: string;
  recall: string;
  f1: string;
  auc: string;
  mcc: string;
  kappa: string;
}

const evaluationTable: ModelRow[] = [
  {
    model: "Logistic Regression",
    accuracy: "85.03%",
    precision: "29.20%",
    recall: "74.22%",
    f1: "41.91%",
    auc: "0.8992",
    mcc: "0.4020",
    kappa: "0.3513",
  },
  {
    model: "Random Forest",
    accuracy: "90.17%",
    precision: "36.14%",
    recall: "45.78%",
    f1: "40.39%",
    auc: "0.9051",
    mcc: "0.3541",
    kappa: "0.3512",
  },
  {
    model: "XGBoost",
    accuracy: "90.91%",
    precision: "36.27%",
    recall: "32.89%",
    f1: "34.50%",
    auc: "0.9007",
    mcc: "0.2967",
    kappa: "0.2963",
  },
  {
    model: "Support Vector Machine",
    accuracy: "74.74%",
    precision: "21.34%",
    recall: "92.00%",
    f1: "34.64%",
    auc: "0.8886",
    mcc: "0.3660",
    kappa: "0.2589",
  },
];

const evaluationMethods = [
  "Accuracy",
  "Precision",
  "Recall",
  "F1 Score",
  "ROC-AUC",
  "Confusion Matrix",
  "Cross-validation",
  "MCC",
  "Cohen's Kappa",
];

const interpretabilityMethods = [
  "Random Forest Feature Importance",
  "SHAP (TreeExplainer)",
  "Mutual Information",
  "LASSO Coefficients",
  "Consensus Feature Analysis",
];

const technologies = [
  "Python",
  "R",
  "Pandas",
  "NumPy",
  "Scikit-learn",
  "XGBoost",
  "SHAP",
  "Matplotlib",
  "React",
  "Vite",
  "Framer Motion",
];

const workflow = [
  "Data Collection",
  "Data Integration",
  "Data Cleaning",
  "EDA",
  "Feature Engineering",
  "Feature Selection",
  "Model Training",
  "Model Evaluation",
  "Model Interpretation",
  "Risk Assessment",
  "Reporting",
];

export default function ProjectGlance() {
  return (
    <section className={styles.card}>
      <motion.div
        className={styles.inner}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className={styles.header}>
          <h1 className={styles.title}>CardioInsight AI Platform</h1>
          <p className={styles.subtitle}>
            Machine Learning–Based Analysis of Gene, Dietary, and Environmental
            Factors Influencing Cardiovascular Disease Risk
          </p>
        </header>

        <div className={styles.body}>
          <section className={styles.section}>
            <h2 className={styles.heading}>Project Overview</h2>
            <p className={styles.bodyText}>
              CardioInsight AI is a machine learning platform for cardiovascular
              disease (CVD) risk analysis, developed using the National Health
              and Nutrition Examination Survey (NHANES) 2017–2020 data. It
              evaluates demographic, clinical, dietary, laboratory,
              environmental and lifestyle-related factors to understand which
              variables are associated with cardiovascular disease risk.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>Research Objective</h2>
            <p className={styles.bodyText}>
              To develop and evaluate machine learning models capable of
              identifying the factors most strongly associated with
              cardiovascular disease risk, and to use the selected model to
              provide an individual risk assessment for each participant.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>Dataset</h2>
            <dl className={styles.factGrid}>
              {datasetFacts.map((fact) => (
                <div key={fact.label} className={styles.fact}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>Data Preprocessing</h2>
            <ul className={styles.stepList}>
              {preprocessingSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>Feature Selection</h2>
            <div className={styles.methodGrid}>
              {selectionMethods.map((method) => (
                <div key={method.name} className={styles.method}>
                  <h3>{method.name}</h3>
                  <p>{method.description}</p>
                </div>
              ))}
            </div>
            <p className={styles.bodyText}>
              The three rankings were combined through consensus scoring. The
              features consistently important across approaches formed the final
              44-feature matrix that drives every trained model — a concise,
              medically interpretable signature of CVD risk.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>Machine Learning Models</h2>
            <div className={styles.modelGrid}>
              {models.map((model) => (
                <div key={model.name} className={styles.model}>
                  <h3>{model.name}</h3>
                  <p>{model.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>Model Evaluation</h2>
            <p className={styles.bodyText}>
              All models were validated on a held-out test set and through
              cross-validation, using accuracy, precision, recall, F1 score,
              ROC-AUC, confusion matrix, Matthews Correlation Coefficient
              (MCC) and Cohen's Kappa.
            </p>
            <div className={styles.metricsWrap}>
              <ul className={styles.metricChips}>
                {evaluationMethods.map((method) => (
                  <li key={method}>{method}</li>
                ))}
              </ul>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th>Accuracy</th>
                      <th>Precision</th>
                      <th>Recall</th>
                      <th>F1</th>
                      <th>ROC-AUC</th>
                      <th>MCC</th>
                      <th>Kappa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluationTable.map((row) => (
                      <tr
                        key={row.model}
                        className={
                          row.model === "Random Forest"
                            ? styles.bestRow
                            : undefined
                        }
                      >
                        <th scope="row">{row.model}</th>
                        <td>{row.accuracy}</td>
                        <td>{row.precision}</td>
                        <td>{row.recall}</td>
                        <td>{row.f1}</td>
                        <td>{row.auc}</td>
                        <td>{row.mcc}</td>
                        <td>{row.kappa}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>Model Interpretability</h2>
            <p className={styles.bodyText}>
              The platform explains why features influence predictions using a
              combination of interpretability techniques.
            </p>
            <ul className={styles.stepList}>
              {interpretabilityMethods.map((method) => (
                <li key={method}>{method}</li>
              ))}
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>Final Model</h2>
            <p className={styles.bodyText}>
              The Random Forest classifier was selected as the production model.
              It achieved the highest ROC-AUC (0.9051) of all evaluated models,
              which provides the best overall balance between sensitivity and
              specificity for cardiovascular disease risk prediction. The final
              model is deployed behind the platform's inference service and
              drives every individual risk assessment.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>CVD Risk Assessment</h2>
            <p className={styles.bodyText}>
              Users can enter the required patient information through the
              Assessment page and receive an individual cardiovascular risk
              prediction generated by the trained model — including an
              actionable risk probability and category.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>Explainability</h2>
            <p className={styles.bodyText}>
              Users can explore the important predictors for each risk assessment
              and understand how the model reaches its prediction, making
              every model output transparent and clinically interpretable.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>Reporting</h2>
            <p className={styles.bodyText}>
              Every completed assessment can generate a detailed report
              containing the prediction result, risk probability, the assessment
              information entered, and the relevant model interpretation for
              reference and sharing.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>Technology Stack</h2>
            <ul className={styles.techList}>
              {technologies.map((tech) => (
                <li key={tech}>{tech}</li>
              ))}
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>Research Workflow</h2>
            <ol className={styles.workflow}>
              {workflow.map((step, i) => (
                <li key={step} className={styles.workflowStep}>
                  <span>{step}</span>
                  {i < workflow.length - 1 && (
                    <ChevronRight
                      className={styles.workflowArrow}
                      size={16}
                      aria-hidden="true"
                    />
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </motion.div>
    </section>
  );
}