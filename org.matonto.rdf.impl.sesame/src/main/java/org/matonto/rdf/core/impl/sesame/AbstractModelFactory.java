package org.matonto.rdf.core.impl.sesame;

import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Namespace;
import org.matonto.rdf.api.Statement;

import javax.annotation.Nonnull;
import java.util.Collection;
import java.util.Collections;
import java.util.Set;

public abstract class AbstractModelFactory implements ModelFactory {

    @Override
    public Model createModel(@Nonnull Model model) {
        return createModel(model.getNamespaces(), model);
    }

    @Override
    public Model createModel(@Nonnull Collection<? extends Statement> c) {
        return createModel(Collections.emptySet(), c);
    }

    @Override
    public Model createModel(@Nonnull Set<Namespace> namespaces) {
        return createModel(namespaces, Collections.emptySet());
    }

    @Override
    public Model createModel(@Nonnull Set<Namespace> namespaces, @Nonnull Collection<@Nonnull ? extends Statement> c) {
        Model finalModel = createModel();
        finalModel.addAll(c);
        namespaces.forEach(finalModel::setNamespace);
        return finalModel;
    }
}
