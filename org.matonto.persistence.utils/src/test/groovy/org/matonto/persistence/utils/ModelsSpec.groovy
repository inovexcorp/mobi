package org.matonto.persistence.utils

import org.matonto.rdf.api.BNode
import org.matonto.rdf.api.IRI
import org.matonto.rdf.api.Literal
import org.matonto.rdf.api.Model
import org.matonto.rdf.api.Resource
import org.matonto.rdf.core.impl.sesame.LinkedHashModel
import org.matonto.rdf.core.impl.sesame.SimpleBNode
import org.matonto.rdf.core.impl.sesame.SimpleIRI
import org.matonto.rdf.core.impl.sesame.SimpleLiteral
import spock.lang.Specification


class ModelsSpec extends Specification{


    def "objectString returns object string from only statement in model"(){
        setup:
        Model m = new LinkedHashModel();
        IRI sub = new SimpleIRI("http://test.com/sub")
        IRI pred = new SimpleIRI("http://test.com/pred")
        IRI obj = new SimpleIRI("http://test.com/obj")

        when:
        m.add(sub, pred, obj);

        then:
        obj.toString().equals(Models.objectString(m).get());

    }

    def "object returns only object(IRI) in model"(){
        setup:
        Model m = new LinkedHashModel();
        IRI sub = new SimpleIRI("http://test.com/sub")
        IRI pred = new SimpleIRI("http://test.com/pred")
        IRI obj = new SimpleIRI("http://test.com/obj")

        when:
        m.add(sub, pred, obj);

        then:
        obj.equals(Models.object(m).get());
    }

    def "object returns only object(Literal) in model"(){
        setup:
        Model m = new LinkedHashModel();
        IRI sub = new SimpleIRI("http://test.com/sub")
        IRI pred = new SimpleIRI("http://test.com/pred")
        Literal obj = new SimpleLiteral("test")

        when:
        m.add(sub, pred, obj);

        then:
        obj.equals(Models.object(m).get());
    }

    def "objectIRI returns only object IRI in model"(){
        setup:
        Model m = new LinkedHashModel();
        IRI sub = new SimpleIRI("http://test.com/sub")
        IRI pred = new SimpleIRI("http://test.com/pred")
        IRI obj = new SimpleIRI("http://test.com/obj")

        when:
        m.add(sub, pred, obj);

        then:
        obj.equals(Models.objectIRI(m).get())
    }

    def "objectResource returns only object Resource in model"(){
        setup:
        Model m = new LinkedHashModel();
        IRI sub = new SimpleIRI("http://test.com/sub")
        IRI pred = new SimpleIRI("http://test.com/pred")
        IRI obj = new SimpleIRI("http://test.com/obj")

        when:
        m.add(sub, pred, obj);

        then:
        obj.equals(Models.objectResource(m).get())
    }

    def "objectValue returns only object IRI in model"(){
        setup:
        Model m = new LinkedHashModel();
        IRI sub = new SimpleIRI("http://test.com/sub")
        IRI pred = new SimpleIRI("http://test.com/pred")
        IRI obj = new SimpleIRI("http://test.com/obj")
        Literal objLit = new SimpleLiteral("test")


        when:
        m.add(sub, pred, obj);
        m.add(sub, pred, objLit)

        then:
        objLit.equals(Models.objectLiteral(m).get())
    }

    def "predicate returns only predicate in model"(){
        setup:
        Model m = new LinkedHashModel();
        IRI sub = new SimpleIRI("http://test.com/sub")
        IRI pred = new SimpleIRI("http://test.com/pred")
        IRI obj = new SimpleIRI("http://test.com/obj")
        Literal objLit = new SimpleLiteral("test")


        when:
        m.add(sub, pred, obj);
        m.add(sub, pred, objLit)

        then:
        pred.equals(Models.predicate(m).get())
    }

    def "subject returns only subject (IRI) in model"(){
        setup:
        Model m = new LinkedHashModel();
        IRI sub = new SimpleIRI("http://test.com/sub")
        IRI pred = new SimpleIRI("http://test.com/pred")
        IRI obj = new SimpleIRI("http://test.com/obj")

        when:
        m.add(sub, pred, obj);

        then:
        sub.equals(Models.subject(m).get())
    }

    def "subject returns only subject (BNode) in model"(){
        setup:
        Model m = new LinkedHashModel();
        BNode sub = new SimpleBNode("1234");
        IRI pred = new SimpleIRI("http://test.com/pred")
        IRI obj = new SimpleIRI("http://test.com/obj")

        when:
        m.add(sub, pred, obj);

        then:
        sub.equals(Models.subject(m).get())
    }

    def "subjectBNode returns only subject BNode in model"(){
        setup:
        Model m = new LinkedHashModel();
        BNode sub = new SimpleBNode("1234");
        IRI pred = new SimpleIRI("http://test.com/pred")
        IRI obj = new SimpleIRI("http://test.com/obj")

        when:
        m.add(sub, pred, obj);

        then:
        sub.equals(Models.subjectBNode(m).get())
    }

    def "subjectIRI returns only subject (IRI) in model"(){
        setup:
        Model m = new LinkedHashModel();
        IRI sub = new SimpleIRI("http://test.com/sub")
        IRI pred = new SimpleIRI("http://test.com/pred")
        IRI obj = new SimpleIRI("http://test.com/obj")

        when:
        m.add(sub, pred, obj);

        then:
        sub.equals(Models.subjectIRI(m).get())
    }

}
