package org.matonto.persistence.utils;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.matonto.rdf.api.BNode;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;

@Component(provide = org.matonto.persistence.utils.BNodeService.class)
public class BNodeService {

    private ValueFactory vf;
    private ModelFactory mf;

    public static final String BNODE_NAMESPACE = "bnode:";

    public BNodeService() {}

    @Reference
    public void setValueFactory(ValueFactory valueFactory) {
        vf = valueFactory;
    }

    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        mf = modelFactory;
    }

    /**
     * Skolemizes the provided BNode.
     *
     * @param bnode BNode to skolemize.
     * @return Resource containing the skolemized BNode.
     */
    public Resource skolemize(BNode bnode) {
        return vf.createIRI(BNODE_NAMESPACE, bnode.getID());

        /*return value instanceof BNode ? vf.createIRI(BNODE_NAMESPACE, ((BNode) value).getID()) : value;*/
    }

    /**
     * Skolemizes any BNodes found in the provided Statement.
     *
     * @param statement Statement to search for BNodes to skolemize.
     * @return Statement which contains skolemized BNodes if that is required.
     */
    public Statement skolemize(Statement statement) {
        boolean skolemized = false;
        Resource subject = statement.getSubject();
        if (subject instanceof BNode) {
            subject = skolemize((BNode) subject);
            skolemized = true;
        }
        Value object = statement.getObject();
        if (object instanceof BNode) {
            object = skolemize((BNode) object);
            skolemized = true;
        }
        return skolemized ? vf.createStatement(subject, statement.getPredicate(), object) : statement;

        /*Resource subject = (Resource) skolemize(statement.getSubject());
        Value object = skolemize(statement.getObject());
        return vf.createStatement(subject, statement.getPredicate(), object);*/
    }

    /**
     * Skolemizes all BNodes found in every Statement within the provided Model.
     *
     * @param model Model to search for BNodes to skolemize.
     * @return Model which contains the skolemized BNodes.
     */
    public Model skolemize(Model model) {
        Model result = mf.createModel();
        model.forEach(statement -> result.add(skolemize(statement)));
        return result;
    }

    /**
     * Deskolemizes the provided IRI.
     *
     * @param iri IRI to deskolemize.
     * @return Value containing the deskolemized BNode.
     */
    public Value deskolemize(IRI iri) {
        return vf.createBNode(iri.getLocalName());

        /*if (iri.getNamespace().equals("bnode:")) {
            return vf.createBNode(iri.getLocalName());
        }
        return iri;*/
    }

    /**
     * Deskolemizes the skolemized IRIs withing the provided Statement.
     *
     * @param statement Statement to search for skolemized IRIs.
     * @return Statement which contains the newly created BNodes.
     */
    public Statement deskolemize(Statement statement) {
        boolean deskolemized = false;
        Resource subject = statement.getSubject();
        if (isSkolemized(subject)) {
            subject = (Resource) deskolemize((IRI) subject);
            deskolemized = true;
        }
        Value object = statement.getObject();
        if (isSkolemized(object)) {
            object = deskolemize((IRI) object);
            deskolemized = true;
        }
        return deskolemized ? vf.createStatement(subject, statement.getPredicate(), object) : statement;

        /*Resource subject = (Resource) deskolemize((IRI) statement.getSubject());
        Value object = deskolemize((IRI) statement.getObject());
        return vf.createStatement(subject, statement.getPredicate(), object);*/
    }

    /**
     * Deskolemizes all skolemized IRIs found in every Statement within the provided Model.
     *
     * @param model Model to search for skolemized IRIs.
     * @return Model which contains the newly created BNodes.
     */
    public Model deskolemize(Model model) {
        Model result = mf.createModel();
        model.forEach(statement -> result.add(deskolemize(statement)));
        return result;
    }

    /**
     * Checks to see if the provided Value is a skolemized IRI.
     *
     * @param value Value to check whether it is a skolemized IRI or not.
     * @return Boolean indicating if the Value is a skolemized IRI.
     */
    private boolean isSkolemized(Value value) {
        return value instanceof IRI && ((IRI) value).getNamespace().equals(BNODE_NAMESPACE);
    }
}
